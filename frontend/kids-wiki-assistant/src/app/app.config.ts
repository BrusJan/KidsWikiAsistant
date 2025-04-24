import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { FirebaseUIModule } from 'firebaseui-angular';
import { routes } from './app.routes';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import * as firebaseui from 'firebaseui';
import { LanguageService } from './services/language.service';
import { provideServiceWorker } from '@angular/service-worker';

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
    importProvidersFrom([
      AngularFireModule.initializeApp(firebaseConfig),
      AngularFireAuthModule,
      AngularFireDatabaseModule,
      FirebaseUIModule.forRoot(firebaseUiAuthConfig),
    ]),
    LanguageService, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
};