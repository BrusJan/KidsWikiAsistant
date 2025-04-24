import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CookieConsentService } from '../../services/cookie-consent.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="!consentGiven" 
         class="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-50 animate-slide-up"
         @fadeInUp>
      <div class="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-sm text-gray-700">
          {{ translateKey('cookie.message') }}
          <a routerLink="/terms" class="text-primary hover:underline">
            {{ translateKey('cookie.policy_link') }}
          </a>
        </div>
        <div class="flex gap-2">
          <button (click)="acceptCookies()" 
                  class="py-2 px-4 bg-primary text-white rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm">
            {{ translateKey('cookie.accept') }}
          </button>
          <button (click)="declineCookies()" 
                  class="py-2 px-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 text-sm">
            {{ translateKey('cookie.decline') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-slide-up {
      animation: slideUp 0.3s ease-out;
    }
    
    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }
  `],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' })),
      ]),
    ]),
  ]
})
export class CookieConsentComponent implements OnInit {
  consentGiven = false;

  constructor(
    private cookieConsentService: CookieConsentService,
    private languageService: LanguageService
  ) {}

  ngOnInit() {
    this.consentGiven = this.cookieConsentService.hasRespondedToConsent();
  }

  acceptCookies() {
    this.cookieConsentService.giveConsent(true);
    this.consentGiven = true;
  }

  declineCookies() {
    this.cookieConsentService.giveConsent(false);
    this.consentGiven = true;
  }
  
  // Use direct translation method instead of pipe
  translateKey(key: string): string {
    return this.languageService.translate(key);
  }
}