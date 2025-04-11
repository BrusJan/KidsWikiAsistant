import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

export type Language = 'cs' | 'en';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<Language>(this.getInitialLanguage());
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  // Available languages
  public availableLanguages: LanguageOption[] = [
    { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  private translations: Record<Language, Record<string, string>> = {
    cs: {},
    en: {}
  };

  private translationsLoaded = false;

  constructor(private http: HttpClient) {
    this.loadTranslations().then(() => {
      console.log('Translations loaded');
      this.translationsLoaded = true;
    });
    
    // Save language preference when changed
    this.currentLanguage$.subscribe(language => {
      localStorage.setItem('preferredLanguage', language);
    });
  }

  private getInitialLanguage(): Language {
    // Get language from localStorage or use default from environment
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && this.isValidLanguage(savedLanguage)) {
      return savedLanguage;
    }
    return (environment.defaultLanguage as Language) || 'cs';
  }

  private isValidLanguage(lang: string): lang is Language {
    return ['cs', 'en'].includes(lang);
  }

  private async loadTranslations(): Promise<void> {
    try {
      // Load Czech translations
      const csResponse = await this.http.get<Record<string, string>>('assets/i18n/cs.json').toPromise();
      this.translations.cs = csResponse || {};
      
      // Load English translations
      const enResponse = await this.http.get<Record<string, string>>('assets/i18n/en.json').toPromise();
      this.translations.en = enResponse || {};
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  public changeLanguage(language: Language): void {
    console.log('Changing language to:', language);
    this.currentLanguageSubject.next(language);
  }

  public getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  public translate(key: string, replacements: Record<string, string> = {}): string {
    if (!this.translationsLoaded) {
      return key; // Return key if translations aren't loaded yet
    }
    
    const currentLang = this.getCurrentLanguage();
    let translation = this.translations[currentLang][key] || key;

    // Replace placeholders with actual values
    Object.keys(replacements).forEach(placeholder => {
      translation = translation.replace(`{{${placeholder}}}`, replacements[placeholder]);
    });

    return translation;
  }
}