import { Component, OnInit, OnDestroy, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { combineLatest, Subject, takeUntil } from "rxjs";
import { IconComponent } from "../../shared/icon/icon.component";
import { StateService } from "../../services/state.service";
import { MarketApi } from "./market-api.service";
import { FavoritesService } from "./favorites.service";
import { MarketCardComponent } from "./listing-card.component";
import { ListingFormComponent } from "./listing-form.component";
import { DialogDirective } from "./dialog.directive";
import {
  MARKETS,
  REGIONS,
  MarketKind,
  MarketListing,
  MarketFilters,
  emptyFilters,
  filterListings,
} from "./market.models";
@Component({
  selector: "app-marketplace",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IconComponent,
    MarketCardComponent,
    ListingFormComponent,
    DialogDirective,
  ],
  templateUrl: "./market.component.html",
  styles: [":host{display:block}"],
})
export class MarketComponent implements OnInit, OnDestroy {
  kind: MarketKind = "animals";
  readonly markets = MARKETS;
  readonly regions = REGIONS;
  items: MarketListing[] = [];
  loading = true;
  error = "";
  filterError = "";
  notice = "";
  showForm = false;
  showFilters = false;
  filters = emptyFilters();
  draftFilters = emptyFilters();
  page = 1;
  view: "grid" | "list" = "grid";
  private generation = 0;
  private destroy = new Subject<void>();
  private initialized = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public api: MarketApi,
    public favorites: FavoritesService,
    public state: StateService,
  ) {}
  get config() {
    return MARKETS[this.kind];
  }
  get categories() {
    return Array.from(
      new Set([
        ...this.config.categories,
        ...this.items.map((a) => a.category).filter(Boolean),
      ]),
    );
  }
  get results() {
    return filterListings(this.items, this.filters);
  }
  get pageCount() {
    return Math.max(1, Math.ceil(this.results.length / 12));
  }
  get currentPage() {
    return Math.min(this.page, this.pageCount);
  }
  get visible() {
    return this.results.slice(
      (this.currentPage - 1) * 12,
      this.currentPage * 12,
    );
  }
  get filterCount() {
    return [
      !!this.filters.category,
      !!this.filters.region,
      this.filters.min !== "",
      this.filters.max !== "",
      this.filters.available,
    ].filter(Boolean).length;
  }
  ngOnInit() {
    try {
      this.view =
        localStorage.getItem("af_market_view") === "list" ? "list" : "grid";
    } catch {}
    combineLatest([this.route.data, this.route.queryParamMap])
      .pipe(takeUntil(this.destroy))
      .subscribe(([data, p]) => {
        const next = (data["kind"] || "animals") as MarketKind;
        const changed = !this.initialized || next !== this.kind;
        this.kind = next;
        this.initialized = true;
        this.filters = {
          q: p.get("q") || "",
          category: p.get("category") || "",
          region: p.get("region") || "",
          min: p.get("min") || "",
          max: p.get("max") || "",
          sort: p.get("sort") || "newest",
          available: p.get("available") === "1",
        };
        this.page = Math.max(1, Number(p.get("page")) || 1);
        if (changed) {
          this.showForm = false;
          this.items = [];
          this.load();
        }
        if (p.get("publish")) this.openPublish();
      });
  }
  async load() {
    const version = ++this.generation;
    this.loading = true;
    this.error = "";
    try {
      const rows = await this.api.list(this.kind);
      if (version === this.generation) this.items = rows;
    } catch {
      if (version === this.generation)
        this.error = "تعذّر تحميل الإعلانات. تثبّت من الاتصال وعاود جرّب.";
    } finally {
      if (version === this.generation) this.loading = false;
    }
  }
  apply(reset = true) {
    if (reset) this.page = 1;
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        q: this.filters.q.trim() || null,
        category: this.filters.category || null,
        region: this.filters.region || null,
        min: this.filters.min === "" ? null : String(this.filters.min),
        max: this.filters.max === "" ? null : String(this.filters.max),
        sort: this.filters.sort === "newest" ? null : this.filters.sort,
        available: this.filters.available ? "1" : null,
        page: this.page > 1 ? this.page : null,
      },
    });
  }
  category(value: string) {
    this.filters.category = value;
    this.apply();
  }
  reset() {
    this.filters = emptyFilters();
    this.apply();
  }
  setView(view: "grid" | "list") {
    this.view = view;
    try {
      localStorage.setItem("af_market_view", view);
    } catch {}
  }
  advanced() {
    this.filterError = "";
    this.draftFilters = { ...this.filters };
    this.showFilters = true;
  }
  saveFilters() {
    const min = Number(this.draftFilters.min || 0);
    const max =
      this.draftFilters.max === "" ? Infinity : Number(this.draftFilters.max);
    if (!Number.isFinite(min) || min < 0 || Number.isNaN(max) || max < min) {
      this.filterError =
        "تثبّت من حدود السعر: أقل سعر موجب وأعلى سعر أكبر منّه.";
      return;
    }
    this.filterError = "";
    this.filters = {
      ...this.draftFilters,
      min: this.draftFilters.min === "" ? "" : String(this.draftFilters.min),
      max: this.draftFilters.max === "" ? "" : String(this.draftFilters.max),
    };
    this.showFilters = false;
    this.apply();
  }
  openPublish() {
    if (!this.state.isLoggedIn()) {
      sessionStorage.setItem("af_pending_market", this.kind);
      window.dispatchEvent(
        new CustomEvent("amanafarm-login-required", {
          detail: { action: "publish" },
        }),
      );
      return;
    }
    this.showForm = true;
  }
  @HostListener("window:amanafarm-authenticated") authenticated() {
    if (sessionStorage.getItem("af_pending_market") === this.kind) {
      sessionStorage.removeItem("af_pending_market");
      this.openPublish();
    }
  }
  saved(item: MarketListing) {
    this.showForm = false;
    void this.router.navigate(["/" + this.kind, item.id]);
  }
  goPage(page: number) {
    this.page = page;
    this.apply(false);
    document
      .getElementById("market-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  ngOnDestroy() {
    this.generation++;
    this.destroy.next();
    this.destroy.complete();
  }
}
