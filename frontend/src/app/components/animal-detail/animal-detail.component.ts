import { AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

declare const lucide: any;

@Component({
  selector: 'app-animal-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './animal-detail.component.html',
  styleUrls: ['./animal-detail.component.css'],
})
export class AnimalDetailComponent implements OnDestroy, AfterViewInit {
  animal: any = null;
  activeImgIdx = 0;
  isLoading = true;

  private sub: Subscription;
  private readonly API = 'http://localhost:8081/api/animals';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private zone: NgZone,
  ) {
    this.sub = this.route.paramMap.subscribe(params =>
      this.loadAnimal(Number(params.get('id'))),
    );
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  private loadAnimal(id: number) {
    this.isLoading = true;
    this.http.get<any>(`${this.API}/${id}`).subscribe({
      next: (a) => {
        this.zone.run(() => {
          const rawImages: any[] = Array.isArray(a.images) ? a.images : [];
          const imageUrls: string[] = rawImages
            .map((img: any) => {
              if (typeof img === 'string') return img;
              if (img && typeof img === 'object') return img.imageUrl ?? img.url ?? img.src ?? '';
              return '';
            })
            .filter(Boolean);

          this.animal = {
            id: a.id,
            name: a.title || 'إعلان حيوان',
            title: a.title || 'إعلان حيوان',
            category: a.category || '',
            price: Number(a.price) || 0,
            priceType: a.priceType || 'FIXED',
            location: a.wilaya || '',
            zone: a.zone || '',
            gender: a.gender || '',
            age: a.age || '',
            healthStatus: a.healthStatus || '',
            description: a.description || '',
            phone: a.phone || '',
            deliveryAvailable: !!a.deliveryAvailable,
            vetCertificate: !!a.vetCertificate,
            featured: !!a.featured,
            trustedSeller: !!a.trustedSeller,
            sellerName: a.sellerName || (a.trustedSeller ? 'بائع موثوق' : 'مستخدم'),
            sellerRating: a.sellerRating || 4.8,
            imageUrls,
            mainImageUrl: imageUrls[0] ?? '',
            views: a.views || 0,
          };

          this.activeImgIdx = 0;
          this.isLoading = false;
          setTimeout(() => this.refreshIcons());
        });
      },
      error: () => {
        this.zone.run(() => {
          this.animal = null;
          this.isLoading = false;
        });
      },
    });
  }

  private refreshIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  fmt(n: string | number): string {
    const num = Number(n ?? 0);
    return isNaN(num) ? '-' : num.toLocaleString('ar-TN');
  }

  formatPriceType(type: string): string {
    const map: Record<string, string> = {
      FIXED: 'سعر ثابت',
      NEGOTIABLE: 'قابل للتفاوض',
      PER_HEAD: 'للراس',
      PER_KG: 'للكيلو',
    };
    return map[type] ?? type;
  }

  openWa() {
    if (!this.animal) return;

    let phone = String(this.animal.phone || '').replace(/\D/g, '');
    if (!phone) {
      alert('رقم الهاتف غير متوفر');
      return;
    }

    if (phone.length === 8) phone = `216${phone}`;
    const msg = encodeURIComponent(
      `مرحبا، نحب نسأل على ${this.animal.name} بسعر ${this.fmt(this.animal.price)} دت في ${this.animal.location}`,
    );

    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  }

  readonly CAT_EMOJIS: Record<string, string> = {
    'أغنام': 'غ',
    'أبقار': 'ب',
    'ماعز': 'م',
    'دواجن': 'د',
    'خيول': 'خ',
    'جمال': 'ج',
    'أرانب': 'أ',
  };
}
