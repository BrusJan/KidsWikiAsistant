import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home.component';
import { ProfileComponent } from './profile/profile.component';
import { CheckoutComponent } from './stripe/checkout.component';
import { SuccessComponent } from './stripe/success.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'payment/success', component: SuccessComponent },
  { path: '**', redirectTo: '' }
];