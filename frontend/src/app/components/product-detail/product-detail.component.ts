import { CommonModule, Location } from '@angular/common';
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StateService } from '../../services/state.service';

declare const lucide: any;

type PriceType = 'FIXED' | 'NEGOTIABLE' | 'PER_KG' | 'PER_TON' | 'PER_UNIT' | string;

interface ProductDetail {
  id: string;
  title: string;
  category: string;
  price: number;
  priceType: PriceType;
  unit: string;
  quantity: string;
  origin: string;
  wilaya: string;
  description: string;
  imageUrls: string[];
  inStock: boolean;
  featured: boolean;
  deliveryAvailable: boolean;
  certified: boolean;
  sellerName: string;
  sellerSubtitle: string;
  sellerRating: number;
  phone: string;
  createdAt: Date;
}

interface DetailSpec {
  icon: string;
  label: string;
  value: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
})
export class ProductDetailComponent implements AfterViewInit, OnDestroy {
  private readonly api = `${environment.apiBaseUrl}/api/products`;
  private readonly sub: Subscription;
  private readonly toastTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private toastCounter = 0;
  private touchStartX = 0;
  private touchStartY = 0;

  product: ProductDetail | null = null;
  similarProducts: ProductDetail[] = [];
  isLoading = true;
  loadError = '';
  selectedImage = '';
  currentPhoto = 0;
  isFav = false;
  zoomOpen = false;
  toasts: Toast[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private location: Location,
    public state: StateService,
  ) {
    this.sub = this.route.paramMap.subscribe(params => {
      this.loadProduct(params.get('id') || '');
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.toastTimers.forEach(timer => clearTimeout(timer));
    document.body.style.overflow = '';
  }

  ngAfterViewInit(): void {
    this.refreshIcons();
  }

  get activeImage(): string {
    return this.selectedImage || this.detailPhotos[this.currentPhoto] || this.fallbackImage;
  }

  get detailPhotos(): string[] {
    return this.product?.imageUrls?.length ? this.product.imageUrls : [this.fallbackImage];
  }

  get detailToasts(): Toast[] {
    return this.toasts;
  }

  get isLoggedIn(): boolean {
    return this.state.isLoggedIn();
  }

  get fallbackImage(): string {
    return '/assets/hero-clean.jpg';
  }

  get specs(): DetailSpec[] {
    const p = this.product;
    if (!p) return [];

    return [
      { icon: 'map-pin', label: 'الولاية', value: this.clean(p.wilaya) },
      { icon: 'boxes', label: 'الفئة', value: this.clean(p.category) },
      { icon: 'package-check', label: 'الكمية', value: this.clean(p.quantity) },
      { icon: 'scale', label: 'الوحدة', value: this.clean(p.unit) },
      { icon: 'sprout', label: 'المنشأ', value: this.clean(p.origin) },
      { icon: 'badge-check', label: 'الحالة', value: this.stockLabel(p) },
    ];
  }

  loadProduct(id: string): void {
    this.isLoading = true;
    this.loadError = '';
    this.product = null;
    this.selectedImage = '';
    this.currentPhoto = 0;

    this.http.get<any>(`${this.api}/${encodeURIComponent(id)}`).pipe(timeout(2500)).subscribe({
      next: data => {
        const product = this.mapApiProduct(data, id);
        this.setProduct(product);
        this.loadSimilar(product);
      },
      error: () => {
        const fallback = this.fallbackProducts().find(item => item.id === id);
        if (!fallback) {
          this.isLoading = false;
          this.loadError = 'هذا المنتج غير موجود أو تعذر تحميله.';
          return;
        }

        this.setProduct(fallback);
        this.similarProducts = this.fallbackProducts()
          .filter(item => item.id !== fallback.id && item.category === fallback.category)
          .slice(0, 4);
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  selectImage(image: string): void {
    this.selectedImage = image;
    const index = this.detailPhotos.indexOf(image);
    this.currentPhoto = index >= 0 ? index : 0;
  }

  setDetailPhoto(index: number): void {
    const safeIndex = Math.max(0, Math.min(index, this.detailPhotos.length - 1));
    this.currentPhoto = safeIndex;
    this.selectedImage = this.detailPhotos[safeIndex] || this.fallbackImage;
  }

  changeDetailPhoto(step: number): void {
    const total = this.detailPhotos.length;
    if (!total) return;
    this.setDetailPhoto((this.currentPhoto + step + total) % total);
  }

  prevImage(): void {
    this.changeDetailPhoto(-1);
  }

  nextImage(): void {
    this.changeDetailPhoto(1);
  }

  onGalleryTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  onGalleryTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy)) return;

    if (dx > 0) this.nextImage();
    else this.prevImage();
  }

  openZoom(): void {
    this.zoomOpen = true;
    document.body.style.overflow = 'hidden';
    this.refreshIcons();
  }

  closeZoom(): void {
    this.zoomOpen = false;
    document.body.style.overflow = '';
  }

  onImageError(): void {
    this.selectedImage = this.fallbackImage;
  }

  contactSeller(): void {
    if (!this.state.isLoggedIn()) {
      this.requireLogin('contact-seller');
      return;
    }
    this.openWhatsapp();
  }

  openWhatsapp(): void {
    if (!this.product) return;
    if (!this.state.isLoggedIn()) {
      this.requireLogin('contact-seller');
      return;
    }

    const phone = this.normalizePhone(this.product.phone);
    if (!phone) {
      this.showToast('رقم الهاتف غير متوفر لهذا المنتج.', 'error');
      return;
    }

    const message = encodeURIComponent(
      `مرحبا، شفت منتج "${this.product.title}" في AMANAFARM ونحب نسأل على التوفر والتوصيل.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
  }

  callSeller(): void {
    if (!this.product) return;
    const phone = this.normalizePhone(this.product.phone);
    if (!phone) {
      this.showToast('رقم الهاتف غير متوفر لهذا المنتج.', 'error');
      return;
    }
    window.location.href = `tel:+${phone}`;
  }

  toggleFav(): void {
    if (!this.state.isLoggedIn()) {
      this.requireLogin('favorite');
      return;
    }
    this.isFav = !this.isFav;
    this.showToast(
      this.isFav ? 'تم حفظ المنتج في المفضلة.' : 'تم حذف المنتج من المفضلة.',
      'success'
    );
  }

  shareProduct(): void {
    const url = window.location.href;
    if (navigator.share && this.product) {
      navigator.share({ title: this.product.title, url }).catch(() => undefined);
      return;
    }
    navigator.clipboard?.writeText(url);
    this.showToast('تم نسخ رابط المنتج', 'success');
  }

  openWa(): void {
    this.openWhatsapp();
  }

  fmt(value: number | string): string {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n.toLocaleString('fr-TN') : '-';
  }

  priceTypeLabel(type: PriceType): string {
    const map: Record<string, string> = {
      FIXED: 'سعر ثابت',
      NEGOTIABLE: 'قابل للتفاوض',
      PER_KG: 'للكيلو',
      PER_TON: 'للطن',
      PER_UNIT: 'للوحدة',
    };
    return map[type] || 'سعر ثابت';
  }

  postedLabel(date: Date): string {
    const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
    if (days === 0) return 'اليوم';
    if (days === 1) return 'منذ يوم';
    if (days < 11) return `منذ ${days} أيام`;
    return `منذ ${days} يوما`;
  }

  stockLabel(product: ProductDetail): string {
    return product.inStock ? 'متوفر الآن' : 'غير متوفر';
  }

  similarImage(item: ProductDetail): string {
    return item.imageUrls[0] || this.fallbackImage;
  }

  trackById(_index: number, item: ProductDetail): string {
    return item.id;
  }

  trackBySpec(_index: number, item: DetailSpec): string {
    return item.label;
  }

  trackByImage(_index: number, image: string): string {
    return image;
  }

  trackByToast(_index: number, toast: Toast): number {
    return toast.id;
  }

  showToast(message: string, type: Toast['type'] = 'info'): void {
    const id = ++this.toastCounter;
    this.toasts = [...this.toasts, { id, message, type }];
    const timer = setTimeout(() => {
      this.toasts = this.toasts.filter(toast => toast.id !== id);
      this.toastTimers.delete(id);
    }, 3200);
    this.toastTimers.set(id, timer);
  }

  private setProduct(product: ProductDetail): void {
    this.product = product;
    this.currentPhoto = 0;
    this.selectedImage = product.imageUrls[0] || this.fallbackImage;
    this.isLoading = false;
    this.refreshIcons();
  }

  private refreshIcons(): void {
    setTimeout(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  }

  private loadSimilar(product: ProductDetail): void {
    this.http.get<any[]>(this.api).pipe(timeout(1800)).subscribe({
      next: list => {
        const mapped = (list || []).map(item => this.mapApiProduct(item, String(item?.id || '')));
        this.similarProducts = mapped
          .filter(item => item.id !== product.id && item.category === product.category)
          .slice(0, 4);
        if (!this.similarProducts.length) {
          this.similarProducts = this.fallbackProducts().filter(item => item.id !== product.id).slice(0, 4);
        }
      },
      error: () => {
        this.similarProducts = this.fallbackProducts().filter(item => item.id !== product.id).slice(0, 4);
      },
    });
  }

  private mapApiProduct(raw: any, id: string): ProductDetail {
    return {
      id: String(raw?.id ?? id),
      title: this.clean(raw?.title || raw?.name || 'منتج فلاحي'),
      category: this.clean(raw?.category || 'منتجات فلاحية'),
      price: Number(raw?.price || 0),
      priceType: raw?.priceType || 'FIXED',
      unit: this.clean(raw?.unit || 'وحدة'),
      quantity: this.clean(raw?.quantity || raw?.stock || 'حسب الاتفاق'),
      origin: this.clean(raw?.origin || 'تونس'),
      wilaya: this.clean(raw?.wilaya || raw?.location || 'تونس'),
      description: this.clean(raw?.description || 'لا يوجد وصف مفصل لهذا المنتج. تواصل مع البائع للتثبت من الكمية والجودة وطريقة التسليم.'),
      imageUrls: this.extractImages(raw),
      inStock: Boolean(raw?.inStock ?? raw?.available ?? true),
      featured: Boolean(raw?.featured),
      deliveryAvailable: Boolean(raw?.deliveryAvailable ?? raw?.hasDelivery),
      certified: Boolean(raw?.certified ?? raw?.verified ?? raw?.companyVerified ?? raw?.sellerVerified),
      sellerName: this.clean(raw?.companyName || raw?.sellerName || 'بائع موثوق'),
      sellerSubtitle: this.clean(raw?.companyTagline || this.sellerTypeLabel(raw?.sellerType)),
      sellerRating: Number(raw?.sellerRating || 4.8),
      phone: this.clean(raw?.phone || raw?.contactPhone || ''),
      createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
    };
  }

  private sellerTypeLabel(type: unknown): string {
    return String(type || '').toLowerCase() === 'company'
      ? 'مورد فلاحي على AMANAFARM'
      : 'بائع مباشر على AMANAFARM';
  }

  private extractImages(raw: any): string[] {
    const urls: string[] = [];
    const add = (value: unknown): void => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach(item => add(item));
        return;
      }
      if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        add(obj['imageUrl'] || obj['url'] || obj['src'] || obj['path']);
        return;
      }
      urls.push(String(value));
    };

    add(raw?.images);
    add(raw?.imageUrls);
    add(raw?.mainImageUrl);
    add(raw?.imageUrl);
    add(raw?.image);

    return [...new Set(urls.map(url => this.normalizeImageUrl(url)).filter(Boolean))];
  }

  private normalizeImageUrl(url: string): string {
    const value = String(url || '').trim();
    if (!value) return '';
    if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;
    if (value.startsWith('assets/')) return `/${value}`;
    if (value.startsWith('uploads/')) return `${environment.apiBaseUrl}/${value}`;
    return `/assets/${value.replace(/^\/+/, '')}`;
  }

  private normalizePhone(raw: string): string {
    let phone = String(raw || '').replace(/\D/g, '');
    if (!phone || phone === '0') return '';
    if (phone.length === 8) phone = `216${phone}`;
    return phone;
  }

  private clean(value: unknown): string {
    const text = String(value ?? '').trim();
    return text && text !== 'undefined' && text !== 'null' ? text : 'غير محدد';
  }

  private requireLogin(action: string): void {
    this.showToast('سجّل الدخول للتواصل مع البائع', 'info');
    window.dispatchEvent(new CustomEvent('amanafarm-login-required', { detail: { action } }));
  }

  private fallbackProducts(): ProductDetail[] {
    const base = (
      id: string,
      title: string,
      category: string,
      price: number,
      images: string[],
      extra: Partial<ProductDetail> = {},
    ): ProductDetail => ({
      id,
      title,
      category,
      price,
      priceType: extra.priceType || (category === 'برودويات طبيعية' ? 'PER_KG' : 'FIXED'),
      unit: extra.unit || (category === 'برودويات طبيعية' ? 'لتر' : 'وحدة'),
      quantity: extra.quantity || 'حسب الاتفاق',
      origin: extra.origin || 'تونس',
      wilaya: extra.wilaya || 'صفاقس',
      description: extra.description || 'منتج فلاحي موثوق على AMANAFARM، متوفر للتواصل المباشر مع البائع والتحقق من الكمية والتوصيل قبل الاتفاق.',
      imageUrls: images.map(image => this.normalizeImageUrl(image)),
      inStock: extra.inStock ?? true,
      featured: extra.featured ?? false,
      deliveryAvailable: extra.deliveryAvailable ?? true,
      certified: extra.certified ?? true,
      sellerName: extra.sellerName || 'مورد موثوق',
      sellerSubtitle: extra.sellerSubtitle || 'منتجات فلاحية تونسية',
      sellerRating: extra.sellerRating || 4.8,
      phone: extra.phone || '55123456',
      createdAt: extra.createdAt || new Date(),
    });

    return [
      base('1', 'علف مركب للأغنام 25كغ', 'علف', 36, [
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=1100&q=85',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1100&q=85',
      ]),
      base('4', 'بذور طماطم هجينة', 'بذور', 18, [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1100&q=85',
      ], { wilaya: 'نابل' }),
      base('7', 'عسل طبيعي جبلي', 'برودويات طبيعية', 42, [
        'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=1100&q=85',
      ], { priceType: 'PER_KG', unit: 'كغ', wilaya: 'سليانة' }),
      base('20', 'زيت زيتون بكر ممتاز', 'برودويات طبيعية', 24, [
        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1100&q=85',
        'https://images.unsplash.com/photo-1515516969-d4008cc6241a?w=1100&q=85',
      ], { featured: true, quantity: '300 لتر', sellerName: 'Natural Farm', wilaya: 'المهدية' }),
      base('21', 'تمر دقلة نور من قبلي', 'برودويات طبيعية', 14, [
        'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=1100&q=85',
      ], { wilaya: 'قبلي' }),
      base('22', 'طماطم موسمية من نابل', 'خضر', 2.8, [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1100&q=85',
      ], { priceType: 'PER_KG', unit: 'كغ', wilaya: 'نابل' }),
      base('23', 'بطاطا موسمية من جندوبة', 'خضر', 2.2, [
        'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1100&q=85',
      ], { priceType: 'PER_KG', unit: 'كغ', wilaya: 'جندوبة' }),
      base('26', 'مضخة ماء فلاحية', 'معدات', 690, [
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1100&q=85',
      ], { wilaya: 'قابس' }),
    ];
  }
}
