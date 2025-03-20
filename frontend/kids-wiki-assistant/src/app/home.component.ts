import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
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

  constructor(private http: HttpClient) { }

  ngOnInit() {
    const saved = localStorage.getItem('wikiResponses');
    if (saved) {
      this.responses = JSON.parse(saved);
    }
  }

  search() {
    if (!this.searchQuery.trim() || this.isLoading) return;
    
    this.isLoading = true; // Set loading state before making request
    
    this.http.get(`https://kidswikiasistant.onrender.com/api/main/kids-summary?query=${encodeURIComponent(this.searchQuery)}`)
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

    this.http.post('https://kidswikiasistant.onrender.com/api/main/report', {
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

  private saveToLocalStorage() {
    localStorage.setItem('wikiResponses', JSON.stringify(this.responses));
  }
}
