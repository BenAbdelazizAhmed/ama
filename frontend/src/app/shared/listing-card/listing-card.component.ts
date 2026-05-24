import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { ImageWithFallbackComponent } from '../image-with-fallback/image-with-fallback.component';

type ListingType = 'animal' | 'product' | 'service';

@Component({
  selector: 'app-listing-card',
  standalone: true,
  imports: [NgIf, RouterLink, ImageWithFallbackComponent],
  templateUrl: './listing-card.component.html',
  styleUrls: ['./listing-card.component.scss'],
})
export class ListingCardComponent {
  @Input() item: any;
  @Input() type: ListingType = 'animal';
  @Input() favorite = false;
  @Output() favoriteToggle = new EventEmitter<any>();

  get route(): unknown[] {
    const base = this.type === 'animal' ? '/animals' : this.type === 'product' ? '/products' : '/services';
    return [base, this.item?.id];
  }

  get title(): string {
    return this.item?.title || this.item?.name || 'إعلان بدون عنوان';
  }

  get image(): string {
    return this.item?.imageUrl || this.item?.mainImageUrl || this.item?.images?.[0] || this.item?.imageUrls?.[0] || '';
  }

  get category(): string {
    return this.item?.category || this.item?.serviceType || 'عام';
  }

  get location(): string {
    return this.item?.governorate || this.item?.wilaya || this.item?.location || this.item?.coverageArea || 'تونس';
  }

  get priceLabel(): string {
    if (this.type === 'service' && !this.item?.price) return 'على حسب الاتفاق';
    const price = Number(this.item?.price ?? 0);
    return price ? `${price.toLocaleString('fr-TN')} د.ت` : 'السعر غير محدد';
  }

  get dateLabel(): string {
    const raw = this.item?.createdAt;
    if (!raw) return 'منذ وقت قريب';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return 'منذ وقت قريب';
    const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
    if (days === 0) return 'اليوم';
    if (days === 1) return 'منذ يوم';
    return `منذ ${days} أيام`;
  }

  get isSold(): boolean {
    return String(this.item?.status || '').toLowerCase() === 'sold';
  }

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favoriteToggle.emit(this.item);
  }
}
