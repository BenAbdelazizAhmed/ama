import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StateService } from '../../services/state.service';

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
export class ProductDetailComponent implements OnDestroy {
  private readonly api = `${environment.apiBaseUrl}/api/products`;
  private readonly sub: Subscription;
  private readonly toastTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private toastCounter = 0;

  product: ProductDetail | null = null;
  similarProducts: ProductDetail[] = [];
  isLoading = true;
  errorMessage = '';
  loadError = '';
  selectedImage = '';
  currentPhoto = 0;
  isFav = false;
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

  get hasLoadError(): boolean {
    return !!this.loadError;
  }

  get loadErrorText(): string {
    return this.loadError || 'تعذر تحميل المنتج.';
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
      { label: 'الولاية', value: this.clean(p.wilaya) },
      { label: 'نوع المنتج', value: this.clean(p.category) },
      { label: 'الكمية', value: this.clean(p.quantity) },
      { label: 'الوحدة', value: this.clean(p.unit) },
      { label: 'الحالة', value: p.inStock ? 'متوفر' : 'غير متوفر' },
      { label: 'السعر', value: `${this.fmt(p.price)} د.ت` },
      { label: 'التوفر', value: this.stockLabel(p) },
      { label: 'قابل للتفاوض', value: this.priceTypeLabel(p.priceType) },
    ];
  }

  loadProduct(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.loadError = '';
    this.product = null;
    this.selectedImage = '';

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
          this.errorMessage = 'هذا المنتج غير موجود أو تعذر تحميله.';
          this.loadError = this.errorMessage;
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

    const message = encodeURIComponent(`مرحبا، شفت منتج "${this.product.title}" في AMANAFARM ونحب نسأل على التوفر والتوصيل.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
  }

  toggleFav(): void {
    if (!this.state.isLoggedIn()) {
      this.requireLogin('favorite');
      return;
    }
    this.isFav = !this.isFav;
    this.showToast(this.isFav ? 'تم حفظ المنتج في المفضلة.' : 'تم حذف المنتج من المفضلة.', 'success');
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
    const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
    if (days === 0) return 'اليوم';
    if (days === 1) return 'منذ يوم';
    return `منذ ${days} أيام`;
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

  trackByPhoto(_index: number, image: string): string {
    return image;
  }

  trackByToast(_index: number, toast: Toast): number {
    return toast.id;
  }

  trackByText(_index: number, item: unknown): string {
    return typeof item === 'string' ? item : JSON.stringify(item);
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
      description: this.clean(raw?.description || 'لا يوجد وصف مفصل لهذا المنتج.'),
      imageUrls: this.extractImages(raw),
      inStock: Boolean(raw?.inStock ?? raw?.available ?? true),
      featured: Boolean(raw?.featured),
      deliveryAvailable: Boolean(raw?.deliveryAvailable ?? raw?.hasDelivery),
      certified: Boolean(raw?.certified ?? raw?.verified),
      sellerName: this.clean(raw?.companyName || raw?.sellerName || 'بائع موثوق'),
      sellerSubtitle: this.clean(raw?.companyTagline || raw?.sellerType || 'مورد فلاحي على AMANAFARM'),
      sellerRating: Number(raw?.sellerRating || 4.8),
      phone: this.clean(raw?.phone || raw?.contactPhone || ''),
      createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
    };
  }

  private extractImages(raw: any): string[] {
    const rawImages = Array.isArray(raw?.images) ? raw.images : [];
    const urls: string[] = rawImages
      .map((img: any) => typeof img === 'string' ? img : (img?.imageUrl || img?.url || img?.src || ''))
      .filter(Boolean);
    if (raw?.mainImageUrl) urls.unshift(raw.mainImageUrl);
    if (raw?.imageUrl) urls.unshift(raw.imageUrl);
    if (raw?.image) urls.unshift(raw.image);
    return [...new Set(urls.map((url: string) => this.normalizeImageUrl(url)).filter(Boolean))];
  }

  private normalizeImageUrl(url: string): string {
    const clean = String(url || '').trim();
    if (!clean) return '';
    if (/^(https?:|data:|blob:|\/)/i.test(clean)) return clean;
    if (clean.startsWith('assets/')) return `/${clean}`;
    if (clean.startsWith('uploads/')) return `${environment.apiBaseUrl}/${clean}`;
    return `/assets/${clean}`;
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
    const base = (id: string, title: string, category: string, price: number, image: string): ProductDetail => ({
      id,
      title,
      category,
      price,
      priceType: category === 'برودويات طبيعية' ? 'PER_KG' : 'FIXED',
      unit: category === 'برودويات طبيعية' ? 'لتر' : 'وحدة',
      quantity: id === '20' ? '300 لتر' : 'حسب الاتفاق',
      origin: 'تونس',
      wilaya: id === '20' ? 'المهدية' : 'صفاقس',
      description: 'منتج فلاحي موثوق على AMANAFARM، متوفر للتواصل المباشر مع البائع والتحقق من الكمية والتوصيل قبل الاتفاق.',
      imageUrls: [image],
      inStock: true,
      featured: id === '20',
      deliveryAvailable: true,
      certified: true,
      sellerName: id === '20' ? 'Natural Farm' : 'مورد موثوق',
      sellerSubtitle: 'منتجات فلاحية تونسية',
      sellerRating: 4.8,
      phone: '55123456',
      createdAt: new Date(),
    });

    return [
      base('1', 'علف مركب للأغنام 25كغ', 'أعلاف', 36, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=900&q=80'),
      base('4', 'بذور طماطم هجينة', 'بذور', 18, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=900&q=80'),
      base('7', 'عسل طبيعي جبلي', 'برودويات طبيعية', 42, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=900&q=80'),
      base('20', 'زيت زيتون بكر ممتاز', 'برودويات طبيعية', 24, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=900&q=80'),
      base('21', 'تمر دقلة نور من قبلي', 'برودويات طبيعية', 14, 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=900&q=80'),
      base('22', 'طماطم موسمية من نابل', 'خضر', 2.8, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=900&q=80'),
      base('23', 'بطاطا موسمية من جندوبة', 'خضر', 2.2, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=900&q=80'),
      base('24', 'فلفل حار تونسي', 'خضر', 5.5, 'https://images.unsplash.com/photo-1526346698789-22fd84314424?w=900&q=80'),
      base('25', 'سماد عضوي تونسي', 'سماد', 95, 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=80'),
      base('26', 'مضخة ماء فلاحية', 'معدات', 690, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=900&q=80'),
    ];
  }
}
