import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { LoginComponent } from './login/login.component';
import { ProfileComponent } from './profile/profile.component';
import { CheckoutComponent } from './stripe/checkout.component';
import { TermsComponent } from './terms-of-service/terms-of-service.component';
import { SuccessComponent } from './stripe/success.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'checkout',
    component: CheckoutComponent
  },
  {
    path: 'payment/success',
    component: SuccessComponent
  },
  {
    path: 'terms',
    component: TermsComponent
  },
  {
    path: 'privacy',
    component: PrivacyPolicyComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];