import { Routes } from "@angular/router";
import { authGuard } from "./core/auth.guard";
const market = () =>
  import("./features/marketplace/market.component").then(
    (m) => m.MarketComponent,
  );
const detail = () =>
  import("./features/marketplace/listing-detail.component").then(
    (m) => m.ListingDetailComponent,
  );
const info = () =>
  import("./features/marketplace/info.component").then((m) => m.InfoComponent);
export const appRoutes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./components/home/home.component").then((m) => m.HomeComponent),
  },
  { path: "animals", loadComponent: market, data: { kind: "animals" } },
  { path: "animals/:id", loadComponent: detail, data: { kind: "animals" } },
  { path: "products", loadComponent: market, data: { kind: "products" } },
  { path: "products/:id", loadComponent: detail, data: { kind: "products" } },
  { path: "wholesale", loadComponent: market, data: { kind: "wholesale" } },
  { path: "wholesale/:id", loadComponent: detail, data: { kind: "wholesale" } },
  { path: "services", loadComponent: market, data: { kind: "services" } },
  { path: "services/:id", loadComponent: detail, data: { kind: "services" } },
  { path: "jobs", loadComponent: market, data: { kind: "jobs" } },
  { path: "jobs/:id", loadComponent: detail, data: { kind: "jobs" } },
  {
    path: "carpool",
    loadComponent: () =>
      import("./components/carpool/carpool.component").then(
        (m) => m.CarpoolComponent,
      ),
  },
  {
    path: "account",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/marketplace/account.component").then(
        (m) => m.AccountComponent,
      ),
  },
  { path: "about", loadComponent: info, data: { page: "about" } },
  { path: "help", loadComponent: info, data: { page: "help" } },
  { path: "legal", loadComponent: info, data: { page: "legal" } },
  {
    path: "404",
    loadComponent: () =>
      import("./components/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },
  { path: "**", redirectTo: "404" },
];
