import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {{ error ? 'Chyba!' : 'Platba byla úspěšná!' }}
          </h2>
          <p class="mt-2 text-center text-sm" [class.text-red-600]="error" [class.text-gray-600]="!error">
            {{ error || 'Vaše předplatné bylo úspěšně aktivováno.' }}
          </p>
        </div>

        <div class="flex justify-center">
          <button
            (click)="navigateToHome()"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            Zpět na hlavní stránku
          </button>
        </div>
      </div>
    </div>
  `
})
export class SuccessComponent implements OnInit {
  error: string | null = null;

  constructor(
    private router: Router,
    private auth: AngularFireAuth,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.verifyPayment();
  }

  private handleError(message: string) {
    this.error = message;
    console.error('Payment error:', message);
  }

  private async verifyPayment() {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId) {
      this.handleError('Chybí ID platební session');
      return;
    }

    try {
      const user = await this.auth.currentUser;
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      const response: any = await this.http.post(`${environment.apiUrl}/api/subscription/verify-session`, {
        sessionId,
        userId: user.uid
      }).toPromise();

      if (response.status === 'success') {
        this.router.navigate(['/']);
      } else {
        this.handleError('Platba nebyla dokončena');
      }
    } catch (error: any) {
      this.handleError(error.message || 'Nastala chyba při ověřování platby');
      console.error('Error verifying payment:', error);
    }
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}