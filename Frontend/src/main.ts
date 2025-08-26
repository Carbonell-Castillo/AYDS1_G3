import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app/app.routes';  
import { AppShellComponent } from './app/app-shell.component'; 

bootstrapApplication(AppShellComponent, {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes, withComponentInputBinding()),
  ],
});
