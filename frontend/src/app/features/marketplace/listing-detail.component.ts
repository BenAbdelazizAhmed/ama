import { Component, OnInit, OnDestroy, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { combineLatest, Subject, takeUntil } from "rxjs";
import { IconComponent } from "../../shared/icon/icon.component";
import { StateService } from "../../services/state.service";
import { MarketApi } from "./market-api.service";
import { FavoritesService } from "./favorites.service";
import { MARKETS, MarketKind, MarketListing } from "./market.models";
import { MarketCardComponent } from "./listing-card.component";
import { ListingFormComponent } from "./listing-form.component";
import { DialogDirective } from "./dialog.directive";
@Component({
  selector: "app-listing-detail",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    MarketCardComponent,
    ListingFormComponent,
    DialogDirective,
  ],
  templateUrl: "./listing-detail.component.html",
  styles: [":host{display:block}"],
})
export class ListingDetailComponent implements OnInit, OnDestroy {
  kind: MarketKind = "animals";
  item: MarketListing | null = null;
  similar: MarketListing[] = [];
  loading = true;
  error = "";
  notice = "";
  selected = 0;
  showForm = false;
  lightbox = false;
  deleting = false;
  private generation = 0;
  private destroy = new Subject<void>();
  readonly markets = MARKETS;
  constructor(
    public route: ActivatedRoute,
    private router: Router,
    public api: MarketApi,
    public favorites: FavoritesService,
    public state: StateService,
  ) {}
  get mine() {
    return !!this.item && this.item.ownerId === this.state.user()?.id;
  }
  get contactPhone() {
    return this.item?.phone || "";
  }
  get canContact() {
    return /^[2459]\d{7}$/.test(this.contactPhone);
  }
  get whatsapp() {
    return (
      "https://wa.me/216" +
      this.contactPhone +
      "?text=" +
      encodeURIComponent("سلام، نحب نستفسر على الإعلان: " + this.item?.title)
    );
  }
  ngOnInit() {
    combineLatest([this.route.data, this.route.paramMap])
      .pipe(takeUntil(this.destroy))
      .subscribe(([data, p]) => {
        this.kind = data["kind"];
        this.load(Number(p.get("id")));
      });
  }
  async load(id: number) {
    const version = ++this.generation;
    this.loading = true;
    this.error = "";
    this.item = null;
    this.similar = [];
    this.selected = 0;
    try {
      const item = await this.api.get(this.kind, id);
      if (version !== this.generation) return;
      this.item = item;
      void this.api
        .list(this.kind)
        .then((rows) => {
          if (version === this.generation)
            this.similar = rows
              .filter((a) => a.id !== id && a.category === item.category)
              .slice(0, 4);
        })
        .catch(() => {});
    } catch (e: any) {
      if (version === this.generation)
        this.error =
          e?.status === 404
            ? "الإعلان موش متاح أو تفسخ."
            : "تعذّر تحميل الإعلان. عاود جرّب.";
    } finally {
      if (version === this.generation) this.loading = false;
    }
  }
  next(step: number) {
    if (this.item?.images.length)
      this.selected =
        (this.selected + step + this.item.images.length) %
        this.item.images.length;
  }
  @HostListener("document:keydown", ["$event"]) key(e: KeyboardEvent) {
    if (!this.lightbox) return;
    if (e.key === "ArrowLeft") this.next(1);
    if (e.key === "ArrowRight") this.next(-1);
  }
  async share() {
    if (!this.item) return;
    const data = { title: this.item.title, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(data.url);
        this.notice = "تنسخ رابط الإعلان.";
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") this.notice = "الرابط: " + data.url;
    }
  }
  async remove() {
    if (
      !this.item ||
      !this.mine ||
      this.deleting ||
      !confirm("متأكد تحب تفسخ الإعلان؟")
    )
      return;
    this.deleting = true;
    try {
      await this.api.remove(this.item);
      void this.router.navigate(["/" + this.kind]);
    } catch {
      this.notice = "ما تفسخش الإعلان. عاود جرّب.";
    } finally {
      this.deleting = false;
    }
  }
  updated(item: MarketListing) {
    this.item = item;
    this.selected = 0;
    this.showForm = false;
    this.notice = "تسجّلت التغييرات بنجاح.";
  }
  hideImage(e: Event) {
    (e.target as HTMLImageElement).style.display = "none";
  }
  ngOnDestroy() {
    this.generation++;
    this.destroy.next();
    this.destroy.complete();
  }
}
