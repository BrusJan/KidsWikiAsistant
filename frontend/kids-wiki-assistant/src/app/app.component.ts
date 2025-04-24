import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CookieConsentComponent } from './components/cookie-consent/cookie-consent.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, CookieConsentComponent],
  template: `
    <router-outlet></router-outlet>
    <app-cookie-consent></app-cookie-consent>
  `
})
export class AppComponent {
  title = 'kids-wiki-assistant';
}