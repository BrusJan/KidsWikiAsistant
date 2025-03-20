import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 class="text-center text-3xl font-extrabold text-gray-900">
            Přihlášení do aplikace
          </h2>
        </div>
        <form class="mt-8 space-y-6" (ngSubmit)="login()">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email-address" class="sr-only">Email</label>
              <input id="email-address" name="email" type="email" [(ngModel)]="email" required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email">
            </div>
            <div>
              <label for="password" class="sr-only">Heslo</label>
              <input id="password" name="password" type="password" [(ngModel)]="password" required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Heslo">
            </div>
          </div>

          <div>
            <button type="submit"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Přihlásit se
            </button>
          </div>
          
          <div *ngIf="error" class="text-red-500 text-sm text-center">
            {{error}}
          </div>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(private router: Router) {}

  async login() {
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, this.email, this.password);
      this.router.navigate(['/']);
    } catch (error: any) {
      this.error = 'Nesprávný email nebo heslo';
      console.error('Login error:', error);
    }
  }
}