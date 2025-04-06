import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { take, timeout } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './services/auth.service';

interface StoredResponses {
  [userId: string]: any[];
}

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule
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
  user$ = this.authService.user$;
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
  showLimitExceededWarning = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private db: AngularFireDatabase,
    private ngZone: NgZone
  ) {
    // Initialize anonymous ID and queries reference in constructor
    this.anonymousId = localStorage.getItem('anonymousId') || this.generateAnonymousId();
    this.queriesRef = this.db.object(`queries/${this.anonymousId}`);
  }

  ngOnInit() {
    // Subscribe to user changes to load appropriate responses
    this.user$.subscribe(user => {
      if (user) {
        const saved = localStorage.getItem('wikiResponses');
        if (saved) {
          const allResponses: StoredResponses = JSON.parse(saved);
          // Get responses for current user or initialize empty array
          this.responses = allResponses[user.uid] || [];
        }
      } else {
        // Do not clear responses when user logs out
        this.responses = [];  // Just clear the component state
      }
    });

    // Check queries count for anonymous users
    this.authService.user$.subscribe(user => {
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
    this.performSearch();
  }

  private async performSearch() {
    this.isLoading = true;
    this.showLimitExceededWarning = false; // Reset warning
    
    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      alert('Pro tuto akci musíte být přihlášen.');
      this.router.navigate(['/login']);
      return;
    }
    
    // Add debug logging
    console.log('Searching with userId:', user.uid);
    
    this.http.get(`${environment.apiUrl}/api/main/kids-summary`, {
      params: {
        query: this.searchQuery,
        userId: user.uid
      }
    })
      .pipe(timeout(30000))
      .subscribe({
        next: (response: any) => {
          if (response.originalTitle === 'Limit vyčerpán') {
            this.showLimitExceededWarning = true;
          } else {
            this.responses.unshift({
              id: Date.now(),
              query: this.searchQuery,
              ...response
            });
            this.saveToLocalStorage();
          }
          this.searchQuery = '';
          this.isLoading = false;
          this.searchInput.nativeElement.focus();
        },
        error: (error) => {
          console.error('Search error:', error);
          this.isLoading = false;
          if (error.status === 401) {
            this.router.navigate(['/login']);
          } else {
            alert('Služba je momentálně nedostupná. Zkuste to prosím později.');
          }
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

  logout() {
    this.authService.logout().subscribe();
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  private saveToLocalStorage() {
    // Get current Firebase user
    this.user$.pipe(take(1)).subscribe(user => {
      if (!user) return;

      const saved = localStorage.getItem('wikiResponses');
      const allResponses: StoredResponses = saved ? JSON.parse(saved) : {};
      // Save responses using Firebase uid
      allResponses[user.uid] = this.responses;
      
      localStorage.setItem('wikiResponses', JSON.stringify(allResponses));
    });
  }
}
