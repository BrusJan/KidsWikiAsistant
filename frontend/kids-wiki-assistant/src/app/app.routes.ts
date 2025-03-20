import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },  // Home route
  { path: 'login', component: LoginComponent },  // Login route
  { path: '**', redirectTo: '' }  // Redirect unknown routes
];