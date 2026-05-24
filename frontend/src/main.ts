import 'zone.js';

import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from "@angular/router";
import { AppComponent } from "./app/app.component";
import { appRoutes } from "./app/app.routes";
import { authInterceptor } from "./app/core/auth.interceptor";

const showApp = () => document.documentElement.classList.add('app-ready');
const failSafe = window.setTimeout(showApp, 2500);

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      appRoutes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' }),
      withPreloading(PreloadAllModules),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
})
  .then(async () => {
    try {
      await document.fonts?.ready;
    } catch {
      /* Font readiness is a polish step only. */
    }
    window.clearTimeout(failSafe);
    requestAnimationFrame(showApp);
  })
  .catch((err: unknown) => {
    showApp();
    console.error(err);
  });
