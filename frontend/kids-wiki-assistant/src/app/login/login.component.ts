import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseUIModule } from 'firebaseui-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FirebaseUIModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 class="text-center text-3xl font-extrabold text-gray-900">
            Přihlášení do aplikace
          </h2>
        </div>
        <firebase-ui></firebase-ui>
      </div>
    </div>
  `
})
export class LoginComponent {
  constructor(private router: Router) {}

  successCallback(event: any) {
    this.router.navigate(['/']);
  }

  errorCallback(event: any) {
    console.error('Auth Error:', event);
  }
}