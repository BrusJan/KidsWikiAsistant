import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../translations/translate.pipe';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-privacy',
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
            <h1 class="text-2xl font-bold text-gray-900">{{ 'privacy.title' | translate }}</h1>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">{{ 'privacy.last_updated' | translate }}: {{ lastUpdated }}</p>
          </div>
          <div class="border-t border-gray-200">
            <div class="px-4 py-5 sm:p-6 prose max-w-none">
              <h2 class="text-xl font-semibold mt-6">{{ 'privacy.introduction' | translate }}</h2>
              <p>{{ 'privacy.introduction_text' | translate }}</p>

              <h2 class="text-xl font-semibold mt-6">{{ 'privacy.info_collected' | translate }}</h2>
              <p>{{ 'privacy.info_collected_text' | translate }}</p>

              <h2 class="text-xl font-semibold mt-6">{{ 'privacy.data_usage' | translate }}</h2>
              <p>{{ 'privacy.data_usage_text' | translate }}</p>

              <h2 class="text-xl font-semibold mt-6">{{ 'privacy.cookies' | translate }}</h2>
              <p>{{ 'privacy.cookies_text' | translate }}</p>

              <h2 class="text-xl font-semibold mt-6">{{ 'privacy.third_parties' | translate }}</h2>
              <p>{{ 'privacy.third_parties_text' | translate }}</p>

              <h2 class="text-xl font-semibold mt-6">{{ 'privacy.data_security' | translate }}</h2>
              <p>{{ 'privacy.data_security_text' | translate }}</p>

              <h2 class="text-xl font-semibold mt-6">{{ 'privacy.childrens_privacy' | translate }}</h2>
              <p>{{ 'privacy.childrens_privacy_text' | translate }}</p>

              <h2 class="text-xl font-semibold mt-6">{{ 'privacy.rights' | translate }}</h2>
              <p>{{ 'privacy.rights_text' | translate }}</p>

              <h2 class="text-xl font-semibold mt-6">{{ 'privacy.changes' | translate }}</h2>
              <p>{{ 'privacy.changes_text' | translate }}</p>

              <h2 class="text-xl font-semibold mt-6">{{ 'privacy.contact' | translate }}</h2>
              <p>{{ 'privacy.contact_text' | translate }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PrivacyPolicyComponent {
  lastUpdated = '2025-04-21';
  
  constructor(private languageService: LanguageService) {}
}