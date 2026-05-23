import 'zone.js';

import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient } from "@angular/common/http";
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from "@angular/router";
import { AppComponent } from "./app/app.component";
import { appRoutes } from "./app/app.routes";

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      appRoutes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' }),
      withPreloading(PreloadAllModules),
    ),
    provideHttpClient(),
  ],
}).catch((err: unknown) => console.error(err));
