import 'zone.js';

import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { AppComponent } from "./app/app.component";
import { appRoutes } from "./app/app.routes";

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' })),
    provideHttpClient(),
  ],
}).catch((err: unknown) => console.error(err));