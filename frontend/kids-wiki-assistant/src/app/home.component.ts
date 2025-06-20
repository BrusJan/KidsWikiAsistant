import { Component, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { take, timeout, takeUntil, firstValueFrom, Subject } from 'rxjs';
import { environment } from '../environments/environment';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AuthService } from './services/auth.service';
import { LanguageService, Language, LanguageOption } from './services/language.service';
import { TranslatePipe } from './translations/translate.pipe';

/**
 * Interface representing the structure of stored responses in localStorage
 * Key is the user ID, value is an array of search responses
 */
interface StoredResponses {
  [userId: string]: Array<{
    id: number;           // Unique identifier (timestamp)
    query: string;        // Original search query
    title: string;        // Response title
    content: string;      // Main content/summary
    url: string;          // Wikipedia URL
    originalTitle?: string; // Original Wikipedia article title
    imageUrl?: string;    // Optional image URL if available
    reported?: boolean;   // Flag to track if response has been reported
  }>;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslatePipe
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
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef;
  user$ = this.authService.user$;
  searchQuery: string = '';
  responses: any[] = [];
  isLoading = false;
  showReportPopup = false;
  selectedResponseId?: number;
  reportText = '';

  // Add the selectedAge property with default value
  selectedAge: number = 7;

  // Add mobile menu state property
  showMobileMenu = false;

  // Define language-specific examples
  private examplesByLanguage: Record<Language, string[]> = {
    'cs': [
      'Dinosauři',
      'Vesmír',
      'Pyramidy',
      'Minecraft'
    ],
    'en': [
      'Dinosaurs',
      'Space',
      'Pyramids',
      'Minecraft'
    ],
    'es': [
      'Dinosaurios',
      'Espacio',
      'Pirámides',
      'Minecraft'
    ],
    'de': [
      'Dinosaurier',
      'Weltraum',
      'Pyramiden',
      'Minecraft'
    ],
    'fr': [
      'Dinosaures',
      'Espace',
      'Pyramides',
      'Minecraft'
    ],
    'it': [
      'Dinosauri',
      'Spazio',
      'Piramidi',
      'Minecraft'
    ],
    'pl': [
      'Dinozaury',
      'Kosmos',
      'Piramidy',
      'Minecraft'
    ]
  };

  // Initialize examples with current language
  searchExamples: string[] = [];

  // Add new properties
  public readonly FREE_QUERIES_LIMIT = 10;
  queriesRemaining: number = this.FREE_QUERIES_LIMIT;
  private queriesRef: any;
  private anonymousId: string | null = null;
  showLimitExceededWarning = false;

  // Language properties
  showLanguageMenu = false;
  availableLanguages: LanguageOption[] = this.languageService.availableLanguages;

  // Add destroy subject
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private db: AngularFireDatabase,
    private ngZone: NgZone,
    private languageService: LanguageService
  ) {
    // Initialize anonymous ID and queries reference in constructor
    this.anonymousId = localStorage.getItem('anonymousId') || this.generateAnonymousId();
    this.queriesRef = this.db.object(`queries/${this.anonymousId}`);

    // Update examples when language changes
    this.updateExamplesForCurrentLanguage();

    // Subscribe to language changes
    this.languageService.currentLanguage$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateExamplesForCurrentLanguage();
    });
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

  // Add ngOnDestroy method
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  /**
   * Updates search examples based on the current language setting
   */
  private updateExamplesForCurrentLanguage(): void {
    const currentLanguage = this.languageService.getCurrentLanguage();
    this.searchExamples = this.examplesByLanguage[currentLanguage] || this.examplesByLanguage['en'];
  }

  async search() {
    if (!this.searchQuery.trim() || this.isLoading) return;
    this.performSearch();
  }

  private async performSearch() {
    this.isLoading = true;
    this.showLimitExceededWarning = false;

    const user = await firstValueFrom(this.authService.user$);
    if (!user) {
      alert('Pro tuto akci musíte být přihlášen.');
      this.router.navigate(['/login']);
      return;
    }

    // Get current language from language service
    const currentLanguage = this.languageService.getCurrentLanguage();

    console.log('Searching with userId:', user.uid, 'language:', currentLanguage, 'age:', this.selectedAge);

    this.http.get(`${environment.apiUrl}/api/main/kids-summary`, {
      params: {
        query: this.searchQuery,
        userId: user.uid,
        language: currentLanguage,
        age: this.selectedAge.toString() // Add age parameter to the request
      }
    })
      .pipe(timeout(30000))
      .subscribe({
        next: (response: any) => {
          // Check if response contains an error code
          if (response.errorCode) {
            this.handleErrorCode(response);
          } else {
            this.responses.unshift({
              id: Date.now(),
              query: this.searchQuery,
              ...response
            });
            this.saveToLocalStorage();
            this.searchQuery = '';
          }
          this.isLoading = false;
          this.searchInput.nativeElement.focus();
        },
        error: (error) => {
          console.error('Search error:', error);
          this.isLoading = false;
          if (error.error.errorCode) {
            this.handleErrorCode(error.error);
          } else if (error.status === 401) {
            this.router.navigate(['/login']);
          } else {
            // Use translated message for the general error
            const errorMessage = this.languageService.translate('error.service_unavailable');
            alert(errorMessage);
          }
        }
      });
  }

  // Add new method to handle error codes with translations
  private handleErrorCode(response: any): void {
    // Get error code and normalize it
    const rawErrorCode = response.errorCode || '';
    const errorCode = rawErrorCode.toLowerCase().replace(/^error_/, '');
    const translationKey = `error.${errorCode}`;

    console.log('Original errorCode:', rawErrorCode, 'Normalized:', errorCode, 'Translation key:', translationKey);

    // Check if this is the limit exceeded error
    if (errorCode === 'limit_exceeded') {
      this.showLimitExceededWarning = true;
      return;
    }

    // Handle article not found special case with query parameter
    if (errorCode === 'article_not_found' && response.query) {
      const errorMessage = this.languageService.translate(translationKey, { query: response.query });
      this.showErrorResponse(errorMessage);
      return;
    }

    // Handle general case
    const errorMessage = this.languageService.translate(translationKey);
    this.showErrorResponse(errorMessage);
  }

  // Show error as a "fake" response in the UI
  private showErrorResponse(message: string): void {
    this.responses.unshift({
      id: Date.now(),
      query: this.searchQuery,
      originalTitle: this.languageService.translate('error.title'),
      kidsFriendlySummary: message,
      url: ''
    });
    this.saveToLocalStorage();
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

    // Get the current user's email from the auth service
    this.user$.pipe(take(1)).subscribe(user => {
      const userEmail = user?.email || 'anonymous@user.com';

      this.http.post(`${environment.apiUrl}/api/main/report`, {
        responseId: this.selectedResponseId,
        query: response.query,
        text: this.reportText,
        responseText: response.kidsFriendlySummary,
        userEmail: userEmail // Always use the authenticated user's email
      }).subscribe({
        next: () => {
          console.log('Report submitted successfully');
          // Mark response as reported
          if (response) {
            response.reported = true;
            this.saveToLocalStorage();
          }
          this.closeReportPopup();
        },
        error: (error) => {
          console.error('Error submitting report:', error);
        }
      });
    });
  }

  login() {
    this.showMobileMenu = false;
    this.router.navigate(['/login']);
  }

  logout() {
    this.showMobileMenu = false;
    this.authService.logout().subscribe();
  }

  navigateToProfile() {
    this.showMobileMenu = false;
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

  toggleLanguageMenu(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.showLanguageMenu = !this.showLanguageMenu;
  }

  // Add method to toggle mobile menu
  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  changeLanguage(lang: Language) {
    this.languageService.changeLanguage(lang);
    // Examples will be updated through the subscription
  }

  getCurrentLanguage(): LanguageOption {
    const currentCode = this.languageService.getCurrentLanguage();
    return this.availableLanguages.find(lang => lang.code === currentCode)
      || this.availableLanguages[0];
  }

  isCurrentLanguage(code: Language): boolean {
    return this.languageService.getCurrentLanguage() === code;
  }
}
