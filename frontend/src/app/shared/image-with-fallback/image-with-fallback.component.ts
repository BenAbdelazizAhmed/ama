import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

type ImageKind = 'animal' | 'product' | 'service';

@Component({
  selector: 'app-image-with-fallback',
  standalone: true,
  imports: [NgIf],
  templateUrl: './image-with-fallback.component.html',
  styleUrls: ['./image-with-fallback.component.scss'],
})
export class ImageWithFallbackComponent {
  @Input() src = '';
  @Input() alt = '';
  @Input() type: ImageKind = 'animal';

  isLoading = true;
  hasError = false;

  get imageSrc(): string {
    if (this.hasError || !this.src) return this.fallbackSrc;
    return this.src;
  }

  get fallbackSrc(): string {
    const map: Record<ImageKind, string> = {
      animal: 'assets/prod-sheep.jpg',
      product: 'assets/hero-clean.jpg',
      service: 'assets/services/farm-products.svg',
    };
    return map[this.type];
  }

  onLoad(): void {
    this.isLoading = false;
  }

  onError(): void {
    this.hasError = true;
    this.isLoading = false;
  }
}
