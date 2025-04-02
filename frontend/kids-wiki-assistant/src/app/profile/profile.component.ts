import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('200ms ease-in-out'))
    ])
  ],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <!-- Back Button -->
        <div class="mb-4">
          <button
            (click)="navigateToHome()"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-sm">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Zpět na hlavní stránku
          </button>
        </div>

        <div class="bg-white shadow rounded-lg overflow-hidden">
          <!-- Profile Header -->
          <div class="px-4 py-5 sm:px-6 bg-primary/10">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Uživatelský profil</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">
              Správa předplatného a nastavení účtu
            </p>
          </div>

          <!-- Profile Content -->
          <div class="px-4 py-5 sm:p-6">
            <div *ngIf="user$ | async as user; else loading">
              <div class="mb-6">
                <h4 class="text-base font-medium text-gray-900">Email</h4>
                <p class="mt-1 text-sm text-gray-600">{{ user.email }}</p>
              </div>

              <!-- Password Management with Accordion -->
              <div class="mb-6">
                <button 
                  (click)="isPasswordExpanded = !isPasswordExpanded"
                  class="flex items-center w-full text-left"
                >
                  <svg 
                    [class.rotate-90]="isPasswordExpanded"
                    class="w-5 h-5 transition-transform duration-200 mr-2 text-gray-400"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                  <h4 class="text-base font-medium text-gray-900">Změna hesla</h4>
                </button>

                <!-- Expandable Content -->
                <div [@expandCollapse]="isPasswordExpanded ? 'expanded' : 'collapsed'">
                  <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="mt-4 space-y-4">
                    <div>
                      <label for="currentPassword" class="block text-sm font-medium text-gray-700">
                        Současné heslo
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        formControlName="currentPassword"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <label for="newPassword" class="block text-sm font-medium text-gray-700">
                        Nové heslo
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        formControlName="newPassword"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        [disabled]="!passwordForm.valid || isChangingPassword"
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span *ngIf="!isChangingPassword">Změnit heslo</span>
                        <span *ngIf="isChangingPassword">Měním heslo...</span>
                      </button>
                    </div>
                  </form>

                  <!-- Success/Error Messages -->
                  <div *ngIf="passwordMessage" class="mt-4">
                    <p [ngClass]="{'text-green-600': !passwordError, 'text-red-600': passwordError}" class="text-sm">
                      {{ passwordMessage }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Subscription Status -->
              <div class="mb-6">
                <h4 class="text-base font-medium text-gray-900">Předplatné</h4>
                <div class="mt-1">
                  <div *ngIf="isLoading" class="flex items-center">
                    <div class="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2"></div>
                    <span class="text-sm text-gray-600">Kontroluji stav předplatného...</span>
                  </div>
                  <ng-container *ngIf="!isLoading">
                    <p class="text-sm" [ngClass]="{'text-green-600': hasActiveSubscription, 'text-gray-600': !hasActiveSubscription}">
                      {{ hasActiveSubscription ? 'Aktivní' : 'Neaktivní' }}
                    </p>
                    
                    <!-- Subscribe Button -->
                    <button
                      *ngIf="!hasActiveSubscription"
                      (click)="startSubscription()"
                      [disabled]="isLoading"
                      class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed">
                      <span *ngIf="!isLoading">Aktivovat předplatné</span>
                      <span *ngIf="isLoading">Načítání...</span>
                    </button>

                    <!-- Cancel Subscription -->
                    <button
                      *ngIf="hasActiveSubscription"
                      (click)="cancelSubscription()"
                      class="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      Zrušit předplatné
                    </button>
                  </ng-container>
                </div>
              </div>
            </div>

            <ng-template #loading>
              <div class="flex justify-center py-6">
                <div class="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  user$ = this.auth.user;
  hasActiveSubscription = false;
  isLoading = true;  // Add new flag for status check
  passwordForm: FormGroup;
  isChangingPassword = false;
  passwordMessage = '';
  passwordError = false;
  isPasswordExpanded = false;

  constructor(
    private auth: AngularFireAuth,
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.checkSubscriptionStatus();
  }

  private checkSubscriptionStatus() {
    this.user$.subscribe(user => {
      if (user) {
        this.isLoading = true;  // Show loader while checking
        // Add userId to query params
        this.http.get(`${environment.apiUrl}/api/subscription/status?userId=${user.uid}`).subscribe({
          next: (response: any) => {
            this.hasActiveSubscription = response.active;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error checking subscription:', error);
            this.isLoading = false;
          }
        });
      }
    });
  }

  async startSubscription() {
    this.isLoading = true;
    const user = await this.auth.currentUser;
    
    if (!user) {
      this.isLoading = false;
      return;
    }

    try {
      const response: any = await this.http.post(`${environment.apiUrl}/api/subscription/create-session`, {
        userId: user.uid,
        email: user.email
      }).toPromise();

      // Redirect to Stripe Checkout
      window.location.href = response.url;
    } catch (error) {
      console.error('Error creating subscription:', error);
      this.isLoading = false;
    }
  }

  async cancelSubscription() {
    const user = await this.auth.currentUser;
    
    if (!user) return;

    try {
      const response = await this.http.post(`${environment.apiUrl}/api/subscription/cancel`, {
        userId: user.uid
      }).toPromise();

      if (response && 'success' in response) {
        this.hasActiveSubscription = false;
        // Optionally show success message
      }
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      // Show error to user
      alert(error.error?.error || 'Failed to cancel subscription');
    } finally {
      // Refresh subscription status
      this.checkSubscriptionStatus();
    }
  }

  async changePassword() {
    if (!this.passwordForm.valid) return;

    this.isChangingPassword = true;
    this.passwordMessage = '';
    this.passwordError = false;

    try {
      const user = await this.auth.currentUser;
      if (!user || !user.email) throw new Error('No user logged in');

      // Reauthenticate user
      const credential = await this.auth.signInWithEmailAndPassword(
        user.email,
        this.passwordForm.get('currentPassword')?.value
      );

      // Update password
      await user.updatePassword(this.passwordForm.get('newPassword')?.value);
      
      this.passwordMessage = 'Heslo bylo úspěšně změněno';
      this.passwordForm.reset();
    } catch (error: any) {
      this.passwordError = true;
      this.passwordMessage = 'Chyba při změně hesla: ' + (error.message || 'Neznámá chyba');
    } finally {
      this.isChangingPassword = false;
    }
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}