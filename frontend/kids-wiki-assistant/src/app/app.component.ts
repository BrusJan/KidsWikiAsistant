import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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
export class AppComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
  searchQuery: string = '';
  responses: any[] = [];
  isLoading = false;
  showReportPopup = false;
  selectedResponseId?: number;
  reportText = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const saved = localStorage.getItem('wikiResponses');
    if (saved) {
      this.responses = JSON.parse(saved);
    }
  }

  search() {
    if (!this.searchQuery.trim() || this.isLoading) return;
    
    this.isLoading = true;
    this.http.get(`http://localhost:3000/api/main/kids-summary?query=${encodeURIComponent(this.searchQuery)}`)
      .subscribe({
        next: (response: any) => {
          this.responses.unshift({
            id: Date.now(),
            query: this.searchQuery,
            ...response
          });
          this.saveToLocalStorage();
          this.searchQuery = '';
          this.isLoading = false;
          this.searchInput.nativeElement.focus();
        },
        error: (error) => {
          console.error('Error:', error);
          this.isLoading = false;
          this.searchInput.nativeElement.focus();
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
    console.log('Reported issue:', {
      responseId: this.selectedResponseId,
      text: this.reportText
    });
    this.closeReportPopup();
  }

  private saveToLocalStorage() {
    localStorage.setItem('wikiResponses', JSON.stringify(this.responses));
  }
}
