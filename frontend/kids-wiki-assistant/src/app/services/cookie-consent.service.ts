import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {
  private consentSubject = new BehaviorSubject<boolean>(false);
  public consent$ = this.consentSubject.asObservable();
  
  constructor() {
    // Initialize from localStorage
    const savedConsent = localStorage.getItem('cookieConsent');
    if (savedConsent) {
      this.consentSubject.next(savedConsent === 'true');
    }
  }
  
  giveConsent(accepted: boolean) {
    localStorage.setItem('cookieConsent', accepted.toString());
    this.consentSubject.next(accepted);
    
    if (accepted) {
      this.initializeTrackingServices();
    } else {
      this.disableTrackingServices();
    }
  }
  
  hasGivenConsent(): boolean {
    return localStorage.getItem('cookieConsent') === 'true';
  }
  
  hasRespondedToConsent(): boolean {
    return localStorage.getItem('cookieConsent') !== null;
  }
  
  private initializeTrackingServices() {
    // Initialize Google Analytics, Facebook Pixel, etc.
  }
  
  private disableTrackingServices() {
    // Disable or remove tracking cookies
  }
}