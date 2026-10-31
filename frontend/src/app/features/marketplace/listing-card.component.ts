import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { IconComponent } from "../../shared/icon/icon.component";
import { MarketListing, MARKETS } from "./market.models";
import { MarketApi } from "./market-api.service";
import { FavoritesService } from "./favorites.service";
@Component({
  selector: "app-market-card",
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: ` <article class="mk-card" [class.mk-list-card]="view === 'list'">
    <a class="mk-card-photo" [routerLink]="['/' + item.kind, item.id]"
      ><div class="mk-card-placeholder">
        <app-icon [name]="markets[item.kind].icon" /><span
          >الصورة غير متوفرة</span
        >
      </div>
      <img
        *ngIf="item.images.length"
        [src]="api.image(item.images[0])"
        [alt]="item.title"
        loading="lazy"
        decoding="async"
        (error)="hideImage($event)"
      /><span class="mk-card-label" *ngIf="!item.available"
        >غير متاح حالياً</span
      ></a
    ><button
      type="button"
      class="mk-heart"
      [class.saved]="favorites.has(item.kind, item.id)"
      [disabled]="favorites.busy(item.kind, item.id)"
      [attr.aria-label]="
        favorites.has(item.kind, item.id)
          ? 'إزالة من المفضّلة'
          : 'حفظ في المفضّلة'
      "
      [attr.aria-pressed]="favorites.has(item.kind, item.id)"
      (click)="favorites.toggle(item.kind, item.id)"
    >
      <app-icon name="heart" />
    </button>
    <div class="mk-card-content">
      <div class="mk-card-topline">
        <span>{{ item.category || markets[item.kind].label }}</span
        ><span *ngIf="item.createdAt">{{
          item.createdAt | date: "dd MMM"
        }}</span>
      </div>
      <a [routerLink]="['/' + item.kind, item.id]" class="mk-card-title">{{
        item.title
      }}</a
      ><span class="mk-card-location"
        ><app-icon name="pin" /> {{ item.place || "تونس" }}</span
      >
      <div class="mk-card-footer">
        <strong
          >{{ item.price ? (item.price | number: "1.0-2") : "بالاتفاق" }}
          <small *ngIf="item.price"
            >دت<span *ngIf="item.unit"> / {{ item.unit }}</span></small
          ></strong
        ><span class="mk-card-link"><app-icon name="diagonal" /></span>
      </div>
    </div>
  </article>`,
  styles: [":host{display:block}"],
})
export class MarketCardComponent {
  @Input() view: "grid" | "list" = "grid";
  @Input({ required: true }) item!: MarketListing;
  readonly markets = MARKETS;
  constructor(
    public api: MarketApi,
    public favorites: FavoritesService,
  ) {}
  hideImage(event: Event) {
    (event.target as HTMLImageElement).style.display = "none";
  }
}
