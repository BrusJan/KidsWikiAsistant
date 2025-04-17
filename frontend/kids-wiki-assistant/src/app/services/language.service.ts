import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

export type Language = 'cs' | 'en' | 'es' | 'de' | 'fr' | 'it' | 'pl';

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
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' }
  ];

  private translations: Record<Language, Record<string, string>> = {
    cs: {},
    en: {},
    es: {},
    de: {},
    fr: {},
    it: {},
    pl: {}
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

  /**
   * Detects browser language and maps it to one of our supported languages
   * @returns Best matching supported language code
   */
  private detectBrowserLanguage(): Language {
    // Get browser language (e.g. "en-US", "fr", "cs")
    const browserLang = navigator.language.toLowerCase();
    
    // Try to match the exact language code first (e.g. "en", "fr")
    const primaryLanguage = browserLang.split('-')[0];
    
    // Check if the browser's primary language is directly supported
    if (this.isValidLanguage(primaryLanguage)) {
      return primaryLanguage as Language;
    }
    
    // If browser language isn't directly supported, try to find a fallback
    // based on language families or regions
    switch (primaryLanguage) {
      // Slavic languages can fall back to Czech or Polish
      case 'sk': // Slovak
      case 'hr': // Croatian
      case 'sl': // Slovenian
        return 'cs';
      
      // Germanic languages can fall back to German
      case 'nl': // Dutch
      case 'da': // Danish
      case 'no': // Norwegian
      case 'sv': // Swedish
        return 'de';
      
      // Romance languages can fall back to Spanish, French, or Italian
      case 'pt': // Portuguese
      case 'ro': // Romanian
      case 'ca': // Catalan
        return 'es';
      
      // Default to English for all other languages
      default:
        return 'en';
    }
  }

  private getInitialLanguage(): Language {
    // First check if user has a saved preference
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && this.isValidLanguage(savedLanguage)) {
      return savedLanguage;
    }
    
    // If no saved preference, check for the first visit flag
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    
    if (!hasVisitedBefore) {
      // First visit - detect browser language and save it
      localStorage.setItem('hasVisitedBefore', 'true');
      const detectedLanguage = this.detectBrowserLanguage();
      localStorage.setItem('preferredLanguage', detectedLanguage);
      return detectedLanguage;
    }
    
    // Default to environment setting if no saved preference and not first visit
    return (environment.defaultLanguage as Language) || 'cs';
  }

  private isValidLanguage(lang: string): lang is Language {
    return ['cs', 'en', 'es', 'de', 'fr', 'it', 'pl'].includes(lang);
  }

  private async loadTranslations(): Promise<void> {
    try {
      // Load Czech translations
      const csResponse = await this.http.get<Record<string, string>>('assets/i18n/cs.json').toPromise();
      this.translations.cs = csResponse || {};
      
      // Load English translations
      const enResponse = await this.http.get<Record<string, string>>('assets/i18n/en.json').toPromise();
      this.translations.en = enResponse || {};
      
      // Load Spanish translations
      const esResponse = await this.http.get<Record<string, string>>('assets/i18n/es.json').toPromise();
      this.translations.es = esResponse || {};
      
      // Load German translations
      const deResponse = await this.http.get<Record<string, string>>('assets/i18n/de.json').toPromise();
      this.translations.de = deResponse || {};
      
      // Load French translations
      const frResponse = await this.http.get<Record<string, string>>('assets/i18n/fr.json').toPromise();
      this.translations.fr = frResponse || {};
      
      // Load Italian translations
      const itResponse = await this.http.get<Record<string, string>>('assets/i18n/it.json').toPromise();
      this.translations.it = itResponse || {};
      
      // Load Polish translations
      const plResponse = await this.http.get<Record<string, string>>('assets/i18n/pl.json').toPromise();
      this.translations.pl = plResponse || {};
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

  public hasTranslation(key: string): boolean {
    if (!this.translationsLoaded) {
      return false;
    }
    
    const currentLang = this.getCurrentLanguage();
    return !!this.translations[currentLang][key];
  }
}