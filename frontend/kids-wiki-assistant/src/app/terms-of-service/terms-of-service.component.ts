import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../translations/translate.pipe';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <div class="min-h-screen bg-background py-6">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-6">
          <a routerLink="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            {{ 'app.back.home' | translate }}
          </a>
        </div>
        
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6 bg-primary/10">
            <h1 class="text-2xl font-bold text-gray-900">{{ 'terms.title' | translate }}</h1>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">{{ 'terms.last_updated' | translate }}: {{ lastUpdated }}</p>
          </div>
          <div class="border-t border-gray-200">
            <div class="px-4 py-5 sm:p-6 prose max-w-none">
              <h2>{{ 'terms.introduction' | translate }}</h2>
              <p>{{ 'terms.introduction_text' | translate }}</p>
              
              <h2>{{ 'terms.usage_rights' | translate }}</h2>
              <p>{{ 'terms.usage_rights_text' | translate }}</p>
              
              <h2>{{ 'terms.content_policy' | translate }}</h2>
              <p>{{ 'terms.content_policy_text' | translate }}</p>
              
              <h2>{{ 'terms.subscription' | translate }}</h2>
              <p>{{ 'terms.subscription_text' | translate }}</p>
              
              <h2>{{ 'terms.privacy' | translate }}</h2>
              <p>{{ 'terms.privacy_text' | translate }}</p>
              
              <h2>{{ 'terms.limitations' | translate }}</h2>
              <p>{{ 'terms.limitations_text' | translate }}</p>
              
              <h2>{{ 'terms.contact' | translate }}</h2>
              <p>{{ 'terms.contact_text' | translate }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TermsComponent {
  lastUpdated = '2023-07-01';
  
  constructor(private languageService: LanguageService) {}
}