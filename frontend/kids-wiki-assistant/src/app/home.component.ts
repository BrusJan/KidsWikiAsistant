import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { timeout } from 'rxjs/operators';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { environment } from '../environments/environment';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [
        CommonModule,
        FormsModule
    ],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.95)' }),
                animate('150ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
            ]),
        ]),
    ]
})
export class HomeComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
  searchQuery: string = '';
  responses: any[] = [];
  isLoading = false;
  showReportPopup = false;
  selectedResponseId?: number;
  reportText = '';

  // Add example searches
  searchExamples = [
    'Dinosauři',
    'Vesmír',
    'Pyramidy',
    'Minecraft'
  ];

  // Add new properties
  public readonly FREE_QUERIES_LIMIT = 10;
  queriesRemaining: number = this.FREE_QUERIES_LIMIT;
  private queriesRef: any;
  private anonymousId: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    public auth: AngularFireAuth,
    private db: AngularFireDatabase,
    private ngZone: NgZone
  ) {
    // Initialize anonymous ID and queries reference in constructor
    this.anonymousId = localStorage.getItem('anonymousId') || this.generateAnonymousId();
    this.queriesRef = this.db.object(`queries/${this.anonymousId}`);
  }

  ngOnInit() {
    const saved = localStorage.getItem('wikiResponses');
    if (saved) {
      this.responses = JSON.parse(saved);
    }

    // Check queries count for anonymous users
    this.auth.user.subscribe(user => {
      if (!user || user.isAnonymous) {
        this.checkQueriesRemaining();
      }
    });
  }

  private async checkQueriesRemaining() {
    try {
      const queryCount = await firstValueFrom(this.queriesRef.valueChanges());
      this.ngZone.run(() => {
        this.queriesRemaining = this.FREE_QUERIES_LIMIT - (queryCount as number || 0);
      });
    } catch (error) {
      console.error('Error checking queries:', error);
    }
  }

  private generateAnonymousId(): string {
    const id = Math.random().toString(36).substring(2);
    localStorage.setItem('anonymousId', id);
    return id;
  }

  private async incrementQueryCount() {
    if (!this.anonymousId) return;

    try {
      const currentCount = await +firstValueFrom(this.queriesRef.valueChanges()) || 0;
      await this.queriesRef.set(currentCount + 1);
      this.ngZone.run(() => {
        this.queriesRemaining--;
      });
    } catch (error) {
      console.error('Error incrementing query count:', error);
    }
  }

  async search() {
    if (!this.searchQuery.trim() || this.isLoading) return;

    const user = await firstValueFrom(this.auth.user);
    
    // Check if user is anonymous and has queries remaining
    if (!user || user.isAnonymous) {
      if (this.queriesRemaining <= 0) {
        alert('Dosáhli jste limitu dotazů. Pro pokračování se prosím přihlaste.');
        this.router.navigate(['/login']);
        return;
      }
      await this.incrementQueryCount();
    }
    
    this.isLoading = true; // Set loading state before making request
    
    this.http.get(`${environment.apiUrl}/api/main/kids-summary?query=${encodeURIComponent(this.searchQuery)}`)
      .pipe(timeout(30000)) // 30 second timeout
      .subscribe({
        next: (response: any) => {
          this.responses.unshift({
            id: Date.now(),
            query: this.searchQuery,
            ...response
          });
          this.saveToLocalStorage();
          this.searchQuery = '';
          this.isLoading = false; // Reset loading state on success
          this.searchInput.nativeElement.focus();
        },
        error: (error) => {
          console.error('Error:', error);
          this.isLoading = false; // Reset loading state on error
          this.searchInput.nativeElement.focus();
          // Show user-friendly error message
          alert('Služba je momentálně nedostupná. Zkuste to prosím později.');
        }
      });
  }

  searchExample(query: string) {
    this.searchQuery = query;
    this.search();
  }

  deleteResponse(id: number) {
    this.responses = this.responses.filter(r => r.id !== id);
    this.saveToLocalStorage();
  }

  reportResponseIssue(id: number) {
    this.selectedResponseId = id;
    this.showReportPopup = true;
    this.reportText = '';
  }

  closeReportPopup() {
    this.showReportPopup = false;
    this.selectedResponseId = undefined;
    this.reportText = '';
  }

  submitReport() {
    const response = this.responses.find(r => r.id === this.selectedResponseId);
    if (!response) return;

    this.http.post(`${environment.apiUrl}/api/main/report`, {
      responseId: this.selectedResponseId,
      query: response.query,
      text: this.reportText
    }).subscribe({
      next: () => {
        console.log('Report submitted successfully');
        this.closeReportPopup();
      },
      error: (error) => {
        console.error('Error submitting report:', error);
      }
    });
  }

  login() {
    this.router.navigate(['/login']);
  }

  async logout() {
    try {
        await this.auth.signOut();
        console.log('User signed out successfully');
    } catch (error) {
        console.error('Error signing out:', error);
    }
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  private saveToLocalStorage() {
    localStorage.setItem('wikiResponses', JSON.stringify(this.responses));
  }
}
