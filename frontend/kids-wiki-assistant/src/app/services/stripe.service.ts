import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap, tap, filter, take } from 'rxjs/operators';
import { AuthService, UserState } from './auth.service';
import { environment } from '../../environments/environment';

export interface SubscriptionStatus {
  subscription: 'free' | 'premium';
  apiCallsUsed?: number;
  apiCallsLimit?: number;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  // Update API URL to match backend routes
  private apiUrl = `${environment.apiUrl}/api/auth/subscription`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Load the current user's subscription status
   */
  loadSubscriptionStatus(): Observable<SubscriptionStatus> {
    return this.authService.userState$.pipe(
      // Filter out null values and wait for actual user state
      filter((user): user is UserState => user !== null),
      // Now we're guaranteed to have a non-null user
      switchMap(user => {
        console.log('user:', user);
        return this.http.get<SubscriptionStatus>(`${this.apiUrl}/status`, {
          params: { userId: user.uid }
        });
      }),
      catchError(error => {
        console.error('Error loading subscription status:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Start a new subscription
   */
  startSubscription(): Observable<any> {
    return this.authService.userState$.pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('User not authenticated');
        }

        return this.http.post<{url: string}>(`${this.apiUrl}/create-session`, {
          userId: user.uid,
          email: user.email
        });
      }),
      tap(response => {
        window.location.href = response.url;
      }),
      catchError(error => {
        console.error('Error starting subscription:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancel the current subscription
   */
  cancelSubscription(): Observable<any> {
    return this.authService.userState$.pipe(
      take(1), // Add this to prevent multiple emissions
      switchMap(user => {
        if (!user) {
          throw new Error('User not authenticated');
        }

        return this.http.post(`${this.apiUrl}/cancel`, {
          userId: user.uid
        });
      })
    );
  }

  /**
   * Get customer portal URL for subscription management
   */
  getCustomerPortalUrl(): Observable<string> {
    return this.authService.userState$.pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('User not authenticated');
        }

        return this.http.post<{url: string}>(`${this.apiUrl}/create-customer-portal`, {
          userId: user.uid
        });
      }),
      map(response => response.url),
      catchError(error => {
        console.error('Error getting customer portal URL:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if a user can access premium features
   */
  canAccessFeature(): Observable<boolean> {
    return this.authService.userState$.pipe(
      // First ensure we have a user
      switchMap(user => {
        if (!user) {
          return of(false);
        }
        
        return this.loadSubscriptionStatus().pipe(
          map(status => {
            if (status.subscription === 'premium') {
              return true;
            }
            return (status.apiCallsUsed ?? 0) < (status.apiCallsLimit ?? 0);
          }),
          // If there's an error checking status, assume no access
          catchError(() => of(false))
        );
      })
    );
  }
}