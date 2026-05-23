import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

declare const lucide: any;

type PriceType = 'FIXED' | 'NEGOTIABLE' | 'PER_KG' | 'PER_TON' | 'PER_UNIT' | string;
type SellerType = 'company' | 'individual';
type ProductTab = 'description' | 'location' | 'reviews' | 'similar';

interface ProductDetail {
  id: string;
  name: string;
  category: string;
  price: number;
  priceType: PriceType;
  unit?: string;
  quantity?: string;
  origin?: string;
  wilaya?: string;
  description?: string;
  imageUrl?: string;
  inStock?: boolean;
  featured?: boolean;
  deliveryAvailable?: boolean;
  certified?: boolean;
  sellerType: SellerType;
  companyName?: string;
  companyTagline?: string;
  companyVerified?: boolean;
  sellerName?: string;
  sellerVerified?: boolean;
  sellerRating?: string;
  phone?: string;
  createdAt?: Date;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private readonly API = `${environment.apiBaseUrl}/api/products`;
  private routeSub?: Subscription;

  product: ProductDetail | null = null;
  similar: ProductDetail[] = [];
  isLoading = true;
  loadError = '';
  isFav = false;
  activeTab: ProductTab = 'description';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(() => {
      this.loadProduct();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  async loadProduct(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') || '';
    const fallbackProducts = this.mockProducts();
    const fallbackProduct = fallbackProducts.find(item => item.id === id) || fallbackProducts[0];

    this.isLoading = true;
    this.loadError = '';
    this.product = fallbackProduct;
    this.similar = this.getSimilar(fallbackProducts, fallbackProduct);
    setTimeout(() => this.refreshIcons());

    try {
      const [backendProduct, backendList] = await Promise.all([
        firstValueFrom(this.http.get<any>(`${this.API}/${encodeURIComponent(id)}`).pipe(timeout(2200))),
        firstValueFrom(this.http.get<any[]>(this.API).pipe(timeout(2200))).catch(() => []),
      ]);

      this.product = this.mapProduct(backendProduct);
      const products = (backendList || []).map(item => this.mapProduct(item));
      this.similar = this.getSimilar(products.length ? products : fallbackProducts, this.product);
    } catch {
      this.loadError = 'تعذر الاتصال بالخادم، تم عرض نسخة مؤقتة من الإعلان.';
      this.product = fallbackProduct;
      this.similar = this.getSimilar(fallbackProducts, fallbackProduct);
    } finally {
      this.isLoading = false;
      setTimeout(() => this.refreshIcons());
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  switchTab(tab: ProductTab): void {
    this.activeTab = tab;
    setTimeout(() => this.refreshIcons());
  }

  toggleFav(): void {
    this.isFav = !this.isFav;
    setTimeout(() => this.refreshIcons());
  }

  openWhatsapp(product: ProductDetail): void {
    if (!product.phone) return;
    const raw = product.phone.replace(/\D/g, '');
    const phone = raw.startsWith('216') ? raw : `216${raw}`;
    const msg = encodeURIComponent(`سلام، شفت "${product.name}" في AMANAFARM ونحب نسأل عليه.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  }

  share(product: ProductDetail): void {
    const url = `${window.location.origin}/products/${encodeURIComponent(product.id)}`;
    const text = `${product.name} - ${this.fmt(product.price)} دت`;

    if (navigator.share) {
      navigator.share({ title: product.name, text, url }).catch(() => undefined);
      return;
    }

    navigator.clipboard?.writeText(url);
  }

  handleImageError(product: ProductDetail): void {
    product.imageUrl = undefined;
    setTimeout(() => this.refreshIcons());
  }

  sellerName(product: ProductDetail): string {
    return product.sellerType === 'company'
      ? product.companyName || 'مورد موثوق'
      : product.sellerName || 'بائع موثوق';
  }

  sellerSubtitle(product: ProductDetail): string {
    if (product.sellerType === 'company') {
      return product.companyTagline || 'شركة فلاحية موثوقة على AMANAFARM';
    }

    return product.wilaya ? `بائع مباشر من ${product.wilaya}` : 'بائع مباشر';
  }

  isVerified(product: ProductDetail): boolean {
    return !!(product.companyVerified || product.sellerVerified || product.certified);
  }

  postedLabel(product: ProductDetail): string {
    if (!product.createdAt) return 'منذ وقت قريب';

    const days = Math.max(0, Math.floor((Date.now() - product.createdAt.getTime()) / 86400000));
    if (days === 0) return 'اليوم';
    if (days === 1) return 'البارح';
    if (days < 30) return `منذ ${days} أيام`;

    const months = Math.floor(days / 30);
    if (months < 12) return months === 1 ? 'منذ شهر' : `منذ ${months} أشهر`;

    const years = Math.floor(months / 12);
    return years === 1 ? 'منذ عام' : `منذ ${years} أعوام`;
  }

  fmt(price: number): string {
    return new Intl.NumberFormat('ar-TN', { maximumFractionDigits: 2 }).format(price || 0);
  }

  formatPriceType(type?: PriceType): string {
    const map: Record<string, string> = {
      FIXED: 'سعر ثابت',
      NEGOTIABLE: 'قابل للتفاوض',
      PER_KG: 'للكيلو',
      PER_TON: 'للطن',
      PER_UNIT: 'للقطعة',
    };

    return type ? map[type] || String(type) : '';
  }

  categoryIcon(category?: string): string {
    const map: Record<string, string> = {
      علف: 'wheat',
      بذور: 'sprout',
      'دوا بيطري': 'syringe',
      معدات: 'tractor',
      لوازم: 'package',
      سماد: 'leaf',
      'برودويات طبيعية': 'badge-check',
    };

    return map[category || ''] || 'package';
  }

  trackById(_index: number, item: ProductDetail): string {
    return item.id;
  }

  private getSimilar(products: ProductDetail[], product: ProductDetail | null): ProductDetail[] {
    if (!product) return [];
    return products
      .filter(item => item.id !== product.id && (item.category === product.category || item.sellerType === product.sellerType))
      .slice(0, 4);
  }

  private mapProduct(item: any): ProductDetail {
    const sellerType: SellerType = item?.sellerType === 'company' ? 'company' : 'individual';
    const id = item?.id != null ? String(item.id) : String(Date.now());

    return {
      id,
      name: item?.title || item?.name || 'برودوي فلاحي',
      category: item?.category || 'برودويات',
      price: Number(item?.price ?? 0),
      priceType: item?.priceType || 'FIXED',
      unit: item?.unit || undefined,
      quantity: item?.quantity || undefined,
      origin: item?.origin || undefined,
      wilaya: item?.wilaya || item?.location || undefined,
      description: item?.description || undefined,
      imageUrl: item?.imageUrl || this.productImageFor(id, item?.title || item?.name, item?.category),
      inStock: item?.inStock ?? true,
      featured: !!item?.featured,
      deliveryAvailable: !!item?.deliveryAvailable,
      certified: !!item?.certified,
      sellerType,
      companyName: item?.companyName || undefined,
      companyTagline: item?.companyTagline || undefined,
      companyVerified: !!item?.companyVerified,
      sellerName: item?.sellerName || undefined,
      sellerVerified: !!item?.sellerVerified,
      sellerRating: item?.sellerRating || '4.8',
      phone: item?.contactPhone || item?.phone || undefined,
      createdAt: item?.createdAt ? new Date(item.createdAt) : undefined,
    };
  }

  private mockProducts(): ProductDetail[] {
    return [
      {
        id: '20',
        name: 'زيت زيتون بكر ممتاز',
        category: 'برودويات طبيعية',
        price: 22,
        priceType: 'PER_KG',
        unit: 'لتر',
        quantity: '300 لتر',
        origin: 'تونس',
        wilaya: 'المهدية',
        description:
          'زيت زيتون بكر ممتاز من إنتاج تونسي، معروض بكميات مناسبة للعائلات، المطاعم، والمحلات. الجودة مراجعة والتسليم متاح حسب الولاية والكمية.',
        imageUrl: this.productImageFor('20'),
        inStock: true,
        featured: true,
        deliveryAvailable: true,
        certified: true,
        sellerType: 'company',
        companyName: 'Natural Farm',
        companyTagline: 'برودويات طبيعية تونسية',
        companyVerified: true,
        sellerRating: '4.8',
        phone: '74222111',
        createdAt: new Date('2024-11-15'),
      },
      {
        id: '1',
        name: 'علف مركب للأغنام 25كغ',
        category: 'علف',
        price: 45,
        priceType: 'FIXED',
        unit: 'كيس 25كغ',
        quantity: '200 كيس',
        origin: 'تونس',
        wilaya: 'صفاقس',
        description: 'علف متوازن مناسب للأغنام، متوفر بكميات محترمة ومع إمكانية التوصيل حسب الولاية.',
        imageUrl: this.productImageFor('1'),
        inStock: true,
        featured: true,
        deliveryAvailable: true,
        certified: true,
        sellerType: 'company',
        companyName: 'SMSA صفاقس',
        companyTagline: 'مورد علف ومستحضرات فلاحية',
        companyVerified: true,
        sellerRating: '4.9',
        phone: '55123456',
        createdAt: new Date('2024-11-01'),
      },
      {
        id: '4',
        name: 'بذور طماطم هجينة',
        category: 'بذور',
        price: 12,
        priceType: 'PER_UNIT',
        unit: 'علبة 50 بذرة',
        quantity: '80 علبة',
        origin: 'هولندا',
        wilaya: 'نابل',
        description: 'بذور طماطم هجينة مناسبة للموسم، إنتاجية جيدة وموجهة للفلاحين الباحثين عن جودة ثابتة.',
        imageUrl: this.productImageFor('4'),
        inStock: true,
        deliveryAvailable: true,
        certified: true,
        sellerType: 'individual',
        sellerName: 'محمد العجمي',
        sellerVerified: true,
        sellerRating: '4.7',
        phone: '55123456',
        createdAt: new Date('2024-11-10'),
      },
      {
        id: '7',
        name: 'عسل طبيعي جبلي',
        category: 'برودويات طبيعية',
        price: 35,
        priceType: 'PER_KG',
        unit: 'كغ',
        origin: 'تونس',
        wilaya: 'الكاف',
        description: 'عسل جبلي طبيعي من مناطق الكاف، مناسب للاستهلاك العائلي أو البيع بالجملة حسب الكمية.',
        imageUrl: this.productImageFor('7'),
        inStock: true,
        deliveryAvailable: true,
        certified: true,
        sellerType: 'individual',
        sellerName: 'يوسف الغريبي',
        sellerVerified: true,
        sellerRating: '5.0',
        phone: '55123456',
        createdAt: new Date('2024-11-12'),
      },
    ];
  }

  private refreshIcons(): void {
    try {
      lucide?.createIcons?.();
    } catch {
      // Decorative icons should never block the page.
    }
  }

  private productImageFor(id?: string, name = '', category = ''): string {
    const img = (photoId: string) => `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1000&q=82`;
    const byId: Record<string, string> = {
      '1': img('photo-1574323347407-f5e1ad6d020b'),
      '4': img('photo-1592924357228-91a4daadcfea'),
      '7': img('photo-1587049352846-4a222e784d38'),
      '20': img('photo-1474979266404-7eaacbcd87c5'),
    };

    if (id && byId[id]) return byId[id];

    const text = `${name} ${category}`.toLowerCase();
    if (text.includes('زيت') || text.includes('olive')) return byId['20'];
    if (text.includes('عسل')) return byId['7'];
    if (text.includes('طماطم')) return byId['4'];
    if (text.includes('علف') || text.includes('شعير')) return byId['1'];
    return img('photo-1500382017468-9049fed747ef');
  }
}
