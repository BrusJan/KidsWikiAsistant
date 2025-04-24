import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseUIModule } from 'firebaseui-angular';
import { Router, RouterLink } from '@angular/router'; // Add RouterLink import
import { AuthService } from '../services/auth.service';
import { TranslatePipe } from '../translations/translate.pipe';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FirebaseUIModule, FormsModule, TranslatePipe, RouterLink], // Add RouterLink to imports
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div class="flex flex-col gap-6 justify-between items-center">
          <h2 class="text-3xl font-extrabold text-gray-900">
            {{ (isRegistering ? 'login.register.title' : 'login.title') | translate }}
          </h2>
        </div>

        <!-- Custom Email/Password Form -->
        <form (ngSubmit)="isRegistering ? register() : emailLogin()" class="mt-8 space-y-6">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email-address" class="sr-only">Email</label>
              <input id="email-address" 
                     name="email" 
                     type="email" 
                     [(ngModel)]="email" 
                     required
                     class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                     [placeholder]="'login.email' | translate">
            </div>
            <div>
              <label for="password" class="sr-only">{{ 'login.password' | translate }}</label>
              <input id="password" 
                     name="password" 
                     type="password" 
                     [(ngModel)]="password" 
                     required
                     class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                     [placeholder]="'login.password' | translate">
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm">
              <button 
                type="button"
                (click)="resetPassword()"
                [disabled]="isResettingPassword"
                class="text-primary hover:text-primary/90 focus:outline-none"
              >
                {{ 'login.forgot_password' | translate }}
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div *ngIf="resetPasswordMessage" class="mt-2">
            <p [ngClass]="{'text-green-600': !resetPasswordError, 'text-red-600': resetPasswordError}" class="text-sm">
              {{ resetPasswordMessage }}
            </p>
          </div>

          <div class="flex items-center mt-3" *ngIf="isRegistering">
            <input id="terms-agreement" name="termsAgreement" type="checkbox" [(ngModel)]="termsAgreed" required
              class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded">
            <label for="terms-agreement" class="ml-2 block text-sm text-gray-900">
              {{ 'login.agree_terms' | translate }}
            </label>
            <a routerLink="/terms" target="_blank" class="text-primary hover:text-primary/80 cursor-pointer ml-1">
              {{ 'login.terms_link' | translate }}
            </a>
          </div>

          <div>
            <button type="submit" 
                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              {{ (isRegistering ? 'login.register.button' : 'login.button') | translate }}
            </button>
          </div>

          <div *ngIf="error" class="text-red-500 text-sm text-center">
            {{ error }}
          </div>

          <div class="text-sm text-center">
            <button type="button" 
                    (click)="toggleMode()"
                    class="font-medium text-primary hover:text-primary/80">
              {{ (isRegistering ? 'login.login.switch' : 'login.register.switch') | translate }}
            </button>
          </div>
        </form>
<!-- 
        <div class="relative my-4" *ngIf="!(user$ | async)">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">
              {{ 'login.or' | translate }}
            </span>
          </div>
        </div>

        <firebase-ui></firebase-ui> -->
      </div>
    </div>
  `,
})
export class LoginComponent {
  user$ = this.authService.getUser$();
  email = '';
  password = '';
  error = '';
  isRegistering = false;
  isResettingPassword = false;
  resetPasswordMessage = '';
  resetPasswordError = false;
  termsAgreed = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private languageService: LanguageService
  ) { }

  async emailLogin() {
    try {
      await this.authService.loginUser(this.email, this.password).toPromise();
    } catch (error: any) {
      this.error = this.languageService.translate('login.error.invalid_credentials');
      console.error('Login error:', error);
    }
  }

  async register() {
    try {
      if (!this.termsAgreed) {
        this.error = this.languageService.translate('login.error.terms_required');
        return;
      }

      await this.authService.registerUser(this.email, this.password).toPromise();
      this.router.navigate(['/']);
    } catch (error: any) {
      if (error.message === 'EMAIL_EXISTS') {
        this.error = 'Tento email již existuje';
      }
      else if (error.message === 'INVALID_EMAIL') {
        this.error = 'Neplatný email';
      }
      else if (error.message === 'WEAK_PASSWORD') {
        this.error = 'Heslo musí mít alespoň 6 znaků';
      }
      else if (error.message === 'OPERATION_NOT_ALLOWED') {
        this.error = 'Registrace je zakázána';
      }
      else if (error.message === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        this.error = 'Příliš mnoho pokusů o registraci. Zkuste to později';
      }
      else this.error = 'Registrace se nezdařila';
      console.error('Registration error:', error);
    }
  }

  async logout() {
    this.authService.logout().subscribe();
  }

  toggleMode() {
    this.isRegistering = !this.isRegistering;
  }

  async resetPassword() {
    if (!this.email) {
      this.resetPasswordError = true;
      this.resetPasswordMessage = 'Zadejte prosím email';
      return;
    }

    this.isResettingPassword = true;
    this.resetPasswordMessage = '';
    this.resetPasswordError = false;

    try {
      await this.authService.requestPasswordReset(this.email);
      this.resetPasswordMessage = 'Email pro reset hesla byl odeslán';
      this.resetPasswordError = false;
    } catch (error: any) {
      this.resetPasswordError = true;
      this.resetPasswordMessage = 'Chyba při odesílání emailu: ' + (error.message || 'Neznámá chyba');
    } finally {
      this.isResettingPassword = false;
    }
  }
}