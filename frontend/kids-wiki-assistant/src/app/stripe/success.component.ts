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
            Platba byla úspěšná!
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Vaše předplatné bylo úspěšně aktivováno.
          </p>
        </div>

        <div class="flex justify-center">
          <button
            (click)="navigateToProfile()"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            Zpět na profil
          </button>
        </div>
      </div>
    </div>
  `
})
export class SuccessComponent implements OnInit {
  constructor(
    private router: Router,
    private auth: AngularFireAuth,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.verifyPayment();
  }

  private async verifyPayment() {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId) {
      this.router.navigate(['/profile']);
      return;
    }

    try {
      const user = await this.auth.currentUser;
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      await this.http.post(`${environment.apiUrl}/api/subscription/verify-session`, {
        sessionId,
        userId: user.uid
      }).toPromise();

    } catch (error) {
      console.error('Error verifying payment:', error);
      this.router.navigate(['/profile']);
    }
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }
}