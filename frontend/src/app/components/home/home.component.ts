import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { IconComponent } from "../../shared/icon/icon.component";
import { MarketApi } from "../../features/marketplace/market-api.service";
import { FavoritesService } from "../../features/marketplace/favorites.service";
import { MarketCardComponent } from "../../features/marketplace/listing-card.component";
import {
  MarketListing,
  MarketKind,
  REGIONS,
  MARKETS,
} from "../../features/marketplace/market.models";
@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IconComponent,
    MarketCardComponent,
  ],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit, OnDestroy {
  category = "animals";
  query = "";
  region = "";
  filter = "all";
  items: MarketListing[] = [];
  loading = true;
  error = "";
  readonly regions = REGIONS;
  readonly markets = MARKETS;
  readonly categories = [
    { kind: "animals", icon: "animal", label: "الحيوانات" },
    { kind: "products", icon: "grain", label: "المنتجات" },
    { kind: "wholesale", icon: "package", label: "الجملة" },
    { kind: "services", icon: "users", label: "المهن والخدمات" },
    { kind: "carpool", icon: "truck", label: "نقل الحيوانات" },
  ];
  private alive = true;
  constructor(
    public api: MarketApi,
    private router: Router,
    public favorites: FavoritesService,
  ) {}
  get visible() {
    return this.items
      .filter((a) => this.filter === "all" || a.kind === this.filter)
      .slice(0, 8);
  }
  ngOnInit() {
    void this.load();
  }
  async load() {
    this.loading = true;
    this.error = "";
    const result = await Promise.allSettled([
      this.api.list("animals"),
      this.api.list("products"),
    ]);
    if (!this.alive) return;
    this.items = result
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .sort(
        (a, b) =>
          (Date.parse(b.createdAt) || b.id) - (Date.parse(a.createdAt) || a.id),
      );
    if (result.some((r) => r.status === "rejected"))
      this.error = "تعذّر تحميل بعض الإعلانات. تثبّت من الاتصال وعاود جرّب.";
    this.loading = false;
  }
  search() {
    if (this.category === "carpool") {
      void this.router.navigate(["/carpool"], {
        queryParams: {
          from: this.region || null,
          q: this.query.trim() || null,
        },
      });
      return;
    }
    void this.router.navigate(["/" + this.category], {
      queryParams: {
        q: this.query.trim() || null,
        region: this.region || null,
      },
    });
  }
  publish() {
    window.dispatchEvent(new CustomEvent("amanafarm-publish-request"));
  }
  ngOnDestroy() {
    this.alive = false;
  }
}
