import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { initializeApp } from 'firebase/app';
import { routes } from './app.routes';

const firebaseConfig = {
  apiKey: "AIzaSyBrRtlI4rxKX6jr-5WbVeiPMhNk6GzxA9Y",
  authDomain: "vikitorek-d9935.firebaseapp.com",
  projectId: "vikitorek-d9935",
  storageBucket: "vikitorek-d9935.firebasestorage.app",
  messagingSenderId: "257532026112",
  appId: "1:257532026112:web:24eed7009e864d58a3a7e5",
  measurementId: "G-DWWED33TR5"
};

initializeApp(firebaseConfig);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient()
  ]
};