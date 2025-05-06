import { Injectable, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap, of, BehaviorSubject, Subscription } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface PasswordChangeResult {
  success: boolean;
  message: string;
}

// Add this interface at the top with other interfaces
export interface UserState {
  uid: string;
  email: string;
  subscriptionStatus: 'free' | 'premium' | 'cancelled';
  apiCallsUsed: number;
  apiCalls: number;
  totalSearchQueries: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private readonly afAuth: AngularFireAuth;
  public readonly user$: Observable<any>;  // Changed to initialize after afAuth
  
  // Add this BehaviorSubject for user state
  private userState = new BehaviorSubject<UserState | null>(null);
  public userState$ = this.userState.asObservable();
  private userStateSubscription: Subscription;

  constructor(
    afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private http: HttpClient,
    private router: Router,
  ) {
    this.afAuth = afAuth;
    this.user$ = this.afAuth.user;  // Initialize after afAuth is set
    
    // Subscribe to Firebase auth state changes
    this.userStateSubscription = this.afAuth.authState.subscribe(user => {
      if (user) {
        this.fetchUserData(user.uid);
      } else {
        // Clear user state when logged out
        this.userState.next(null);
        localStorage.removeItem('user'); // Clear local storage on logout
      }
    });
  }

  // Add this method after the constructor
  /**
   * Update user state with partial data
   * This will trigger the userState$ subscription and update localStorage
   */
  updateUserState(userData: Partial<UserState>): void {
    const currentState = this.userState.value;
    if (!currentState) {
      console.error('Cannot update user state: No user logged in');
      return;
    }

    const newState: UserState = {
      ...currentState,
      ...userData
    };

    this.userState.next(newState);
  }

  ngOnDestroy() {
    if (this.userStateSubscription) {
      this.userStateSubscription.unsubscribe();
    }
  }

  private fetchUserData(userId: string): void {
    this.http.get<UserState>(`${this.apiUrl}/user/${userId}`).subscribe({
      next: (userData) => this.userState.next(userData),
      error: (error) => console.error('Error fetching user data:', error)
    });
  }

  /**
   * Register a new user
   */
  registerUser(email: string, password: string): Observable<string> {
    return from(this.afAuth.createUserWithEmailAndPassword(email, password)).pipe(
      switchMap(credential => {
        if (!credential.user) {
          throw new Error('Registration failed');
        }
        // Create user in backend
        return this.http.post<{userId: string}>(`${this.apiUrl}/create-user`, {
          userId: credential.user.uid,
          email: email
        });
      }),
      map(response => response.userId)
    );
  }

  /**
   * Login user and fetch their data
   */
  loginUser(email: string, password: string): Observable<void> {
    // Clear any existing state before login
    this.userState.next(null);
    localStorage.removeItem('user');

    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
      tap(credential => {
        if (!credential.user) {
          throw new Error('Login failed');
        }
        // Fetch fresh user data
        this.fetchUserData(credential.user.uid);
      }),
      tap(() => {
        this.router.navigate(['/']);
      }),
      map(() => void 0)
    );
  }

  logout(): Observable<void> {
    return from(this.afAuth.signOut()).pipe(
      tap(() => {
        // Clear state immediately on logout
        this.userState.next(null);
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
      })
    );
  }

  /**
   * Get the current user from localStorage
   */
  getUserState(): UserState | null {
    return this.userState.value;
  }

  getUser$(): Observable<any> {
    return this.user$;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.userState.value !== null;
  }

  getSubscriptionStatus(): Observable<UserState['subscriptionStatus']> {
    const user = this.userState.value;
    if (!user) {
      throw new Error('No user logged in');
    }

    return this.http.get<{status: UserState['subscriptionStatus']}>(`${this.apiUrl}/subscription-status`, {
      params: { userId: user.uid }
    }).pipe(
      tap(response => {
        this.userState.next({
          ...this.userState.value!,
          subscriptionStatus: response.status
        });
      }),
      map(response => response.status)
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<PasswordChangeResult> {
    return from(this.afAuth.currentUser).pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('No user logged in');
        }
        // Re-authenticate user before changing password
        return from(user.reauthenticateWithCredential(
          require('firebase/auth').EmailAuthProvider.credential(user.email!, currentPassword)
        )).pipe(
          switchMap(() => from(user.updatePassword(newPassword))),
          map(() => ({
            success: true,
            message: 'Heslo bylo úspěšně změněno'
          }))
        );
      })
    );
  }

  requestPasswordReset(email: string): Observable<void> {
    return from(this.afAuth.sendPasswordResetEmail(email, {
      url: window.location.origin + '/login',
      handleCodeInApp: false
    }));
  }
}