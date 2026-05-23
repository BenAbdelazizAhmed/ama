import { AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

declare const lucide: any;

type PriceType = 'FIXED' | 'NEGOTIABLE' | 'PER_HEAD' | 'PER_KG' | string;

interface AnimalDetail {
  id: number;
  name: string;
  title: string;
  category: string;
  breed: string;
  price: number;
  priceType: PriceType;
  location: string;
  zone: string;
  gender: string;
  age: string;
  weight: string;
  healthStatus: string;
  description: string;
  phone: string;
  deliveryAvailable: boolean;
  vetCertificate: boolean;
  featured: boolean;
  urgent: boolean;
  trustedSeller: boolean;
  sellerName: string;
  sellerRating: number;
  sellerSince: string;
  responseTime: string;
  imageUrls: string[];
  views: number;
  createdAt: Date;
}

interface SimilarAnimal {
  title: string;
  location: string;
  price: number;
  image: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info';
}

@Component({
  selector: 'app-animal-detail',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './animal-detail.component.html',
  styleUrls: ['./animal-detail.component.css'],
})
export class AnimalDetailComponent implements OnDestroy, AfterViewInit {
  animal: AnimalDetail | null = null;
  activeImgIdx = 0;
  isLoading = true;
  currentPhoto = 0;
  isFav = false;
  activeTab: 'desc' | 'map' | 'reviews' | 'similar' = 'desc';
  detailToasts: Toast[] = [];

  private toastTimers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly detailPhotos = [
    'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=900&q=85',
    'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=900&q=85',
    'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=900&q=85',
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=85',
    'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=900&q=85',
  ];

  readonly similarDetailItems = [
    { name: 'خروف برقي سليانة',    location: 'سليانة',   price: '1,250', image: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=250&q=70', badge: 'جديد'  },
    { name: 'خروف سيدي القيروان', location: 'القيروان',  price: '1,380', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=250&q=70', badge: 'مميز'  },
    { name: 'خروف محلي القصرين',  location: 'القصرين',  price: '1,100', image: '', badge: 'جديد' },
    { name: 'خروف برقي صفاقس',    location: 'صفاقس',    price: '1,300', image: '', badge: ''     },
    { name: 'خروف سيدي بوزيد',    location: 'سيدي بوزيد', price: '1,600', image: '', badge: ''  },
    { name: 'خروف برقي نابل',     location: 'نابل',     price: '1,420', image: '', badge: ''     },
  ];

  readonly similarAnimals: SimilarAnimal[] = [
    { title: 'نعجة بربرية صغيرة',       location: 'القيروان', price: 780,  image: '/assets/prod-sheep.jpg' },
    { title: 'عجل للتسمين',             location: 'صفاقس',   price: 2450, image: '/assets/prod-cow.jpg'   },
    { title: 'ماعز محلي بصحة ممتازة', location: 'نابل',     price: 520,  image: '/assets/prod-goat.jpg'  },
  ];

  private sub: Subscription;
  private readonly API = `${environment.apiBaseUrl}/api/animals`;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private zone: NgZone,
  ) {
    this.sub = this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id') || 101);
      this.loadAnimal(id);
    });
  }

  ngAfterViewInit(): void {
    this.refreshIcons();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    // Clear all pending toast timers to avoid memory leaks
    this.toastTimers.forEach(timer => clearTimeout(timer));
    this.toastTimers.clear();
  }

  // ─────────────────── GALLERY ───────────────────

  selectImage(index: number): void {
    this.activeImgIdx = index;
  }

  prevImage(): void {
    if (!this.animal?.imageUrls.length) return;
    this.activeImgIdx =
      (this.activeImgIdx - 1 + this.animal.imageUrls.length) % this.animal.imageUrls.length;
  }

  nextImage(): void {
    if (!this.animal?.imageUrls.length) return;
    this.activeImgIdx = (this.activeImgIdx + 1) % this.animal.imageUrls.length;
  }

  changeDetailPhoto(dir: number): void {
    this.currentPhoto =
      (this.currentPhoto + dir + this.detailPhotos.length) % this.detailPhotos.length;
  }

  setDetailPhoto(index: number): void {
    this.currentPhoto = index;
  }

  // ─────────────────── FAV / TABS ───────────────────

  toggleFav(): void {
    this.isFav = !this.isFav;
    this.showToast(
      this.isFav ? 'تمت إضافة الإعلان إلى المفضلة' : 'تم إزالة الإعلان من المفضلة',
      this.isFav ? 'success' : 'info',
    );
    setTimeout(() => this.refreshIcons());
  }

  switchDetailTab(tab: 'desc' | 'map' | 'reviews' | 'similar'): void {
    this.activeTab = tab;
    setTimeout(() => this.refreshIcons());
  }

  // ─────────────────── TOASTS ───────────────────

  showToast(message: string, type: 'success' | 'info' = 'info'): void {
    const id = Date.now() + Math.random();
    this.detailToasts = [...this.detailToasts, { id, message, type }];

    const timer = setTimeout(() => {
      this.zone.run(() => {
        this.detailToasts = this.detailToasts.filter(t => t.id !== id);
        this.toastTimers.delete(id);
      });
    }, 3200);

    this.toastTimers.set(id, timer);
  }

  // ─────────────────── TRACK FUNS ───────────────────

  trackByPhoto(_index: number, photo: string): string {
    return photo;
  }

  trackByToast(_index: number, toast: Toast): number {
    return toast.id;
  }

  // ─────────────────── SHARE / WA ───────────────────

  shareAnimal(): void {
    if (!this.animal) return;

    const data = {
      title: this.animal.title,
      text: `${this.animal.title} على AMANAFARM`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(data).catch(() => undefined);
      return;
    }

    navigator.clipboard?.writeText(window.location.href).then(() => {
      this.showToast('تم نسخ رابط الإعلان', 'success');
    });
  }

  openWa(): void {
    if (!this.animal) return;

    let phone = String(this.animal.phone ?? '').replace(/\D/g, '');
    if (!phone) {
      this.showToast('رقم الهاتف غير متوفر', 'info');
      return;
    }

    if (phone.length === 8) phone = `216${phone}`;
    const msg = encodeURIComponent(
      `مرحبا، نحب نسأل على ${this.animal.name} بسعر ${this.fmt(this.animal.price)} دت في ${this.animal.location}.`,
    );

    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  }

  // ─────────────────── FORMATTERS ───────────────────

  fmt(n: string | number): string {
    const num = Number(n ?? 0);
    return Number.isNaN(num) ? '-' : num.toLocaleString('fr-TN');
  }

  formatPriceType(type: PriceType): string {
    const map: Record<string, string> = {
      FIXED:      'سعر ثابت',
      NEGOTIABLE: 'قابل للتفاوض',
      PER_HEAD:   'للرأس',
      PER_KG:     'للكيلو',
    };
    return map[type] ?? String(type ?? '');
  }

  postedLabel(date: Date): string {
    const hours = Math.max(1, Math.round((Date.now() - date.getTime()) / 36e5));
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.round(hours / 24);
    return days === 1 ? 'منذ يوم' : `منذ ${days} أيام`;
  }

  // ─────────────────── PRIVATE ───────────────────

  private loadAnimal(id: number): void {
    this.zone.run(() => this.onAnimalLoaded(this.mockAnimal(id)));

    this.http.get<any>(`${this.API}/${id}`).pipe(timeout(1200)).subscribe({
      next: data => this.zone.run(() => this.onAnimalLoaded(this.mapApiAnimal(data, id))),
      error: ()   => undefined,
    });
  }

  private onAnimalLoaded(animal: AnimalDetail): void {
    this.animal = animal;
    this.activeImgIdx = 0;
    this.isLoading = false;
    setTimeout(() => this.refreshIcons());
  }

  private mapApiAnimal(a: any, id: number): AnimalDetail {
    const fallback  = this.mockAnimal(id);
    const imageUrls = this.extractImages(a);

    return {
      ...fallback,
      id:               Number(a?.id || id),
      name:             a?.title || a?.name            || fallback.name,
      title:            a?.title || a?.name            || fallback.title,
      category:         a?.category                   || fallback.category,
      breed:            a?.breed                      || fallback.breed,
      price:            Number(a?.price)              || fallback.price,
      priceType:        a?.priceType                  || fallback.priceType,
      location:         a?.wilaya || a?.location      || fallback.location,
      zone:             a?.zone                       || fallback.zone,
      gender:           a?.gender                     || fallback.gender,
      age:              a?.age                        || fallback.age,
      weight:           a?.weight                     || fallback.weight,
      healthStatus:     a?.healthStatus               || fallback.healthStatus,
      description:      a?.description               || fallback.description,
      phone:            a?.phone                      || fallback.phone,
      deliveryAvailable: Boolean(a?.deliveryAvailable ?? fallback.deliveryAvailable),
      vetCertificate:   Boolean(a?.vetCertificate    ?? fallback.vetCertificate),
      featured:         Boolean(a?.featured           ?? fallback.featured),
      urgent:           Boolean(a?.urgent             ?? fallback.urgent),
      trustedSeller:    Boolean(a?.trustedSeller      ?? fallback.trustedSeller),
      sellerName:       a?.sellerName                 || fallback.sellerName,
      sellerRating:     Number(a?.sellerRating)       || fallback.sellerRating,
      imageUrls:        imageUrls.length ? imageUrls  : fallback.imageUrls,
      views:            Number(a?.views)              || fallback.views,
      createdAt:        a?.createdAt ? new Date(a.createdAt) : fallback.createdAt,
    };
  }

  private extractImages(a: any): string[] {
    const raw: any[] = Array.isArray(a?.images) ? a.images : [];
    const urls = raw
      .map((img: any) =>
        typeof img === 'string'
          ? img
          : (img?.imageUrl ?? img?.url ?? img?.src ?? ''),
      )
      .filter(Boolean);

    if (a?.mainImageUrl) urls.unshift(a.mainImageUrl);
    return [...new Set(urls)];
  }

  private mockAnimal(id: number): AnimalDetail {
    return {
      id,
      name:             id === 101 ? 'كبش بربري ممتاز للتربية' : 'إعلان حيوان موثوق',
      title:            id === 101 ? 'كبش بربري ممتاز للتربية' : 'إعلان حيوان موثوق',
      category:         'أغنام',
      breed:            'بربري تونسي',
      price:            1250,
      priceType:        'NEGOTIABLE',
      location:         'سيدي بوزيد',
      zone:             'الرقاب',
      gender:           'ذكر',
      age:              'عام ونصف',
      weight:           'حوالي 58 كغ',
      healthStatus:     'صحة ممتازة',
      description:
        'كبش بربري نظيف ومربى في ظروف باهية، مناسب للتربية وتحسين القطيع. الحيوان متعوّد على العلف الطبيعي، صحته ممتازة، ويمكن معاينته في الضيعة قبل الاتفاق. التواصل مباشر مع المربي عبر واتساب، والسعر قابل للتفاوض للجادين.',
      phone:            '55123456',
      deliveryAvailable: true,
      vetCertificate:   true,
      featured:         true,
      urgent:           false,
      trustedSeller:    true,
      sellerName:       'مربي موثوق',
      sellerRating:     4.9,
      sellerSince:      '2024',
      responseTime:     'يرد عادة خلال 20 دقيقة',
      imageUrls:        ['/assets/hero-sheep.png', '/assets/prod-sheep.jpg', '/assets/ba3.png'],
      views:            248,
      createdAt:        new Date(Date.now() - 4 * 36e5),
    };
  }

  private refreshIcons(): void {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}
