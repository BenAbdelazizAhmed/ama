import { Routes } from "@angular/router";

export const appRoutes: Routes = [
  {
    path: "",
    loadComponent: () => import("./components/home/home.component").then(m => m.HomeComponent),
  },
  {
    path: "animals",
    loadComponent: () => import("./components/animals/animals.component").then(m => m.AnimalsComponent),
  },
  {
    path: "animals/:id",
    loadComponent: () => import("./components/animal-detail/animal-detail.component").then(m => m.AnimalDetailComponent),
  },
  {
    path: "services",
    loadComponent: () => import("./components/services/services.component").then(m => m.ServicesComponent),
  },
  {
    path: "wholesale",
    loadComponent: () => import("./components/wholesale/wholesale.component").then(m => m.WholesaleComponent),
  },
  {
    path: "products",
    loadComponent: () => import("./components/products/products.component").then(m => m.ProductsComponent),
  },
  {
    path: "about",
    loadComponent: () => import("./components/about/about.component").then(m => m.AboutComponent),
  },
  {
    path: "**",
    loadComponent: () => import("./components/not-found/not-found.component").then(m => m.NotFoundComponent),
  },
];
