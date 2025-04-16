import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {{ isSuccess ? 'Platba byla úspěšná!' : isError ? 'Chyba při platbě' : 'Zpracovávám platbu...' }}
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            {{ statusMessage }}
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
export class CheckoutComponent implements OnInit {
  isSuccess = false;
  isError = false;
  statusMessage = 'Kontroluji stav platby...';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private auth: AngularFireAuth
  ) {}

  ngOnInit() {
    this.processPayment();
  }

  async processPayment() {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    
    if (!sessionId) {
      this.handleError('Neplatná session');
      return;
    }

    try {
      const user = await this.auth.currentUser;
      if (!user) {
        this.handleError('Uživatel není přihlášen');
        return;
      }

      const response: any = await this.http.post(`${environment.apiUrl}/api/subscription/verify-payment`, {
        sessionId,
        userId: user.uid
      }).toPromise();

      if (response.status === 'success') {
        this.isSuccess = true;
        this.statusMessage = 'Vaše předplatné bylo úspěšně aktivováno!';
      } else {
        this.handleError('Platba nebyla dokončena');
      }
    } catch (error) {
      this.handleError('Nastala chyba při zpracování platby');
      console.error('Payment verification error:', error);
    }
  }

  handleError(message: string) {
    this.isError = true;
    this.statusMessage = message;
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }
}