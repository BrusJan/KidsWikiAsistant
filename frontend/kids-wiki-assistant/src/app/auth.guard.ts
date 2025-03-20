import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private router: Router) {}

  canActivate(): Promise<boolean> {
    return new Promise((resolve) => {
      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          resolve(true);
        } else {
          this.router.navigate(['/login']);
          resolve(false);
        }
      });
    });
  }
}