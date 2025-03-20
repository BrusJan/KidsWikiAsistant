import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { initializeApp } from '@angular/fire/app';
import { getAuth } from '@angular/fire/auth';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideAuth } from '@angular/fire/auth';
import { FirebaseUIModule } from 'firebaseui-angular';
import { routes } from './app.routes';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import * as firebaseui from 'firebaseui';

const firebaseConfig = {
  apiKey: "AIzaSyBrRtlI4rxKX6jr-5WbVeiPMhNk6GzxA9Y",
  authDomain: "vikitorek-d9935.firebaseapp.com",
  projectId: "vikitorek-d9935",
  storageBucket: "vikitorek-d9935.firebasestorage.app",
  messagingSenderId: "257532026112",
  appId: "1:257532026112:web:24eed7009e864d58a3a7e5",
  measurementId: "G-DWWED33TR5"
};

const firebaseUiAuthConfig: firebaseui.auth.Config = {
  signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
  ],
  signInSuccessUrl: '/',
  signInFlow: 'popup',
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    importProvidersFrom(FirebaseUIModule.forRoot(firebaseUiAuthConfig))
  ]
};