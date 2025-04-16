import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { AuthService } from '../services/auth.service';
import { Subject, BehaviorSubject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { StripeService } from '../services/stripe.service';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../translations/translate.pipe';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslatePipe],
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
            {{ 'app.back.home' | translate }}
          </button>
        </div>

        <div class="bg-white shadow rounded-lg overflow-hidden">
          <!-- Profile Header -->
          <div class="px-4 py-5 sm:px-6 bg-primary/10">
            <h3 class="text-lg leading-6 font-medium text-gray-900">{{ 'profile.title' | translate }}</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">
              {{ 'profile.subtitle' | translate }}
            </p>
          </div>

          <!-- Profile Content -->
          <div class="px-4 py-5 sm:p-6">
            <div *ngIf="user$ | async as user; else loading">
              <div class="mb-6">
                <h4 class="text-base font-medium text-gray-900">{{ 'profile.email' | translate }}</h4>
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
                  <h4 class="text-base font-medium text-gray-900">{{ 'profile.change_password' | translate }}</h4>
                </button>

                <!-- Expandable Content -->
                <div [@expandCollapse]="isPasswordExpanded ? 'expanded' : 'collapsed'">
                  <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="mt-4 space-y-4">
                    <div>
                      <label for="currentPassword" class="block text-sm font-medium text-gray-700">
                        {{ 'profile.current_password' | translate }}
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
                        {{ 'profile.new_password' | translate }}
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
                        <span *ngIf="!isChangingPassword">{{ 'profile.submit_change' | translate }}</span>
                        <span *ngIf="isChangingPassword">{{ 'profile.changing_password' | translate }}</span>
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
                <h4 class="text-base font-medium text-gray-900">{{ 'profile.subscription' | translate }}</h4>
                <div class="mt-1">
                  <div *ngIf="isLoading" class="flex items-center">
                    <div class="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2"></div>
                    <span class="text-sm text-gray-600">{{ 'profile.subscription.checking' | translate }}</span>
                  </div>
                  <ng-container *ngIf="!isLoading">
                    <p class="text-sm" [ngClass]="{'text-green-600': hasActiveSubscription, 'text-gray-600': !hasActiveSubscription}">
                      {{ hasActiveSubscription ? 'profile.subscription.active' : 'profile.subscription.inactive' | translate }}
                    </p>
                    
                    <!-- Add subscription end date info -->
                    <p *ngIf="subscriptionEndsAt && cancelAtPeriodEnd" class="text-sm text-amber-600 mt-1">
                      {{ 'profile.subscription.until' | translate }}{{ subscriptionEndsAt | date:'d.M.yyyy' }}
                    </p>

                    <!-- API Calls Info for Free Users -->
                    <div *ngIf="!hasActiveSubscription" class="mt-2">
                      <div class="text-sm text-gray-600">
                        <span>{{ 'profile.subscription.used' | translate}}{{ apiCallsUsed + '/' + apiCallsLimit }}</span>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                          <div class="bg-primary h-2.5 rounded-full" 
                               [style.width]="(apiCallsUsed / apiCallsLimit * 100) + '%'">
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Subscribe/Reactivate Button -->
                    <button
                      *ngIf="!hasActiveSubscription || (hasActiveSubscription && cancelAtPeriodEnd)"
                      (click)="startSubscription()"
                      [disabled]="isLoading"
                      class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed">
                      <span *ngIf="!isLoading">
                        {{ hasActiveSubscription && cancelAtPeriodEnd ? 'profile.subscription.reactivate' : 'profile.subscription.activate' | translate }}
                      </span>
                      <span *ngIf="isLoading">Načítání...</span>
                    </button>

                    <!-- Cancel Subscription -->
                    <button
                      *ngIf="hasActiveSubscription && !cancelAtPeriodEnd"
                      (click)="cancelSubscription()"
                      [disabled]="isLoading"
                      class="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed">
                      {{ isLoading ? 'profile.subscription.canceling' : 'profile.subscription.cancel' | translate }}
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

    <!-- Confirmation Modal -->
    <div *ngIf="showConfirmation$ | async"
         class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          {{ 'profile.subscription.confirm_cancel.title' | translate }}
        </h3>
        <p class="text-sm text-gray-500 mb-4">
          {{ 'profile.subscription.confirm_cancel.message' | translate }}
        </p>
        <div class="flex justify-end space-x-4">
          <button
            (click)="cancelConfirmation()"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-md">
            {{ 'profile.subscription.confirm_cancel.back' | translate }}
          </button>
          <button
            (click)="confirmCancel()"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md">
            {{ 'profile.subscription.confirm_cancel.confirm' | translate }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  user$ = this.authService.getUser$();
  hasActiveSubscription = false;
  isLoading = true;
  passwordForm: FormGroup;
  isChangingPassword = false;
  passwordMessage = '';
  passwordError = false;
  isPasswordExpanded = false;
  apiCallsUsed = 0;
  apiCallsLimit = 10;
  subscriptionEndsAt?: Date;
  cancelAtPeriodEnd = false;
  showConfirmation$ = new BehaviorSubject<boolean>(false);

  constructor(
    private authService: AuthService,
    private stripeService: StripeService,
    private router: Router,
    private fb: FormBuilder,
    private languageService: LanguageService
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.checkSubscriptionStatus();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkSubscriptionStatus() {
    this.stripeService.loadSubscriptionStatus().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (status) => {
        this.hasActiveSubscription = status.subscription === 'premium';
        if (status.currentPeriodEnd) {
          this.subscriptionEndsAt = new Date(status.currentPeriodEnd);
        }
        this.cancelAtPeriodEnd = status.cancelAtPeriodEnd; // This sets the flag
        if (!this.hasActiveSubscription) {
          this.apiCallsUsed = status.apiCallsUsed || 0;
          this.apiCallsLimit = status.apiCallsLimit || 10;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading subscription:', error);
        this.isLoading = false;
      }
    });
  }

  async startSubscription() {
    this.isLoading = true;
    this.stripeService.startSubscription().subscribe({
      error: (error) => {
        console.error('Error starting subscription:', error);
        this.isLoading = false;
      }
    });
  }

  async cancelSubscription() {
    this.showConfirmation$.next(true);
  }

  cancelConfirmation() {
    this.showConfirmation$.next(false);
  }

  async confirmCancel() {
    this.showConfirmation$.next(false);
    if (this.isLoading) return;
    this.isLoading = true;

    this.stripeService.cancelSubscription()
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.hasActiveSubscription = false;
          this.checkSubscriptionStatus();
        },
        error: (error) => {
          console.error('Error canceling subscription:', error);
          alert('Nepodařilo se zrušit předplatné');
        }
      });
  }

  async changePassword() {
    if (!this.passwordForm.valid) return;

    this.isChangingPassword = true;
    this.passwordMessage = '';
    this.passwordError = false;

    const currentPassword = this.passwordForm.get('currentPassword')?.value;
    const newPassword = this.passwordForm.get('newPassword')?.value;

    this.authService.changePassword(currentPassword, newPassword)
      .subscribe({
        next: (result) => {
          this.passwordMessage = result.message;
          this.passwordError = !result.success;
          if (result.success) {
            this.passwordForm.reset();
          }
        },
        error: (error) => {
          this.passwordError = true;
          this.passwordMessage = error.message;
        },
        complete: () => {
          this.isChangingPassword = false;
        }
      });
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}