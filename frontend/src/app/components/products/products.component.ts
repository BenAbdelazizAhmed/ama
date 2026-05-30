import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, firstValueFrom, timeout } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StateService } from '../../services/state.service';

declare const lucide: any;

export type SellerType = 'company' | 'individual';
export type PriceType = 'FIXED' | 'NEGOTIABLE' | 'PER_KG' | 'PER_TON' | 'PER_UNIT';
export type ViewMode = 'grid' | 'list';
export type SortValue = 'newest' | 'cheap' | 'expensive' | 'rating';
export type SellerTypeFilter = 'all' | 'company' | 'individual';
export type ToastType = 'success' | 'error' | 'warn';

export interface Product {
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
  companyId?: string;
  companyName?: string;
  companyTagline?: string;
  companyVerified?: boolean;
  sellerName?: string;
  sellerVerified?: boolean;
  sellerRating?: string;
  phone?: string;
  createdAt?: Date;
}

export interface Company {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  category?: string;
  tags?: string[];
  verified?: boolean;
  productCount: number;
}

export interface HeroStat {
  icon: string;
  value: string;
  label: string;
}

export interface TrustSignal {
  icon: string;
  title: string;
  text: string;
}

export interface Toast {
  type: ToastType;
  msg: string;
}

export interface AddForm {
  sellerType: SellerType;
  companyName: string;
  companyTagline: string;
  name: string;
  category: string;
  price: number | null;
  priceType: PriceType;
  unit: string;
  quantity: string;
  wilaya: string;
  origin: string;
  description: string;
  imagePreview: string;
  imageFile?: File;
  inStock: boolean;
  deliveryAvailable: boolean;
  certified: boolean;
  featured: boolean;
  sellerName: string;
  phone: string;
  email: string;
}

interface BackendProduct {
  id?: number | string;
  title?: string;
  name?: string;
  category?: string;
  description?: string;
  price?: number;
  priceType?: PriceType;
  unit?: string;
  quantity?: string;
  origin?: string;
  location?: string;
  wilaya?: string;
  imageUrl?: string;
  contactPhone?: string;
  phone?: string;
  inStock?: boolean;
  featured?: boolean;
  deliveryAvailable?: boolean;
  certified?: boolean;
  sellerType?: SellerType;
  companyName?: string;
  companyTagline?: string;
  companyVerified?: boolean;
  sellerName?: string;
  sellerVerified?: boolean;
  sellerRating?: string;
  userId?: number | null;
  createdAt?: string;
}

interface ProductPayload {
  title: string;
  category: string;
  description: string;
  price: number;
  priceType: PriceType;
  unit: string;
  quantity: string;
  origin: string;
  location: string;
  wilaya: string;
  imageUrl: string;
  contactPhone: string;
  inStock: boolean;
  featured: boolean;
  deliveryAvailable: boolean;
  certified: boolean;
  sellerType: SellerType;
  companyName: string;
  companyTagline: string;
  companyVerified: boolean;
  sellerName: string;
  sellerVerified: boolean;
  sellerRating: string;
  userId: number | null;
}

export const PROD_CATEGORIES: string[] = [
  'الكل', 'علف', 'بذور', 'دوا بيطري', 'معدات', 'لوازم', 'سماد', 'برودويات طبيعية',
];

export const PROD_CAT_EMOJIS: Record<string, string> = {
  'الكل': 'الكل',
  'علف': 'علف',
  'بذور': 'بذور',
  'دوا بيطري': 'دوا',
  'معدات': 'معدات',
  'لوازم': 'لوازم',
  'سماد': 'سماد',
  'برودويات طبيعية': 'طبيعي',
};

export const PROD_CAT_ICONS: Record<string, string> = {
  'الكل': 'layout-grid',
  'علف': 'wheat',
  'بذور': 'sprout',
  'دوا بيطري': 'syringe',
  'معدات': 'tractor',
  'لوازم': 'package',
  'سماد': 'leaf',
  'برودويات طبيعية': 'badge-check',
};

export const WILAYAS: string[] = [
  'تونس', 'أريانة', 'بن عروس', 'منوبة', 'نابل', 'زغوان', 'بنزرت',
  'باجة', 'جندوبة', 'الكاف', 'سليانة', 'القيروان', 'القصرين', 'سيدي بوزيد',
  'سوسة', 'المنستير', 'المهدية', 'صفاقس', 'قفصة', 'توزر', 'قبلي',
  'قابس', 'مدنين', 'تطاوين',
];

const PAGE_SIZE = 12;

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit, OnDestroy {
  private readonly API_BASE = `${environment.apiBaseUrl}/api`;
  readonly PROD_CATEGORIES = PROD_CATEGORIES;
  readonly PROD_CAT_EMOJIS = PROD_CAT_EMOJIS;
  readonly PROD_CAT_ICONS = PROD_CAT_ICONS;
  readonly WILAYAS = WILAYAS;

  heroStats: HeroStat[] = [
    { icon: 'package-check', value: '1,200+', label: 'برودوي مراجع' },
    { icon: 'shield-check', value: '85', label: 'شركة موثوقة' },
    { icon: 'map-pin', value: '24', label: 'ولاية تونسية' },
    { icon: 'message-circle', value: '24/7', label: 'تواصل مباشر' },
  ];

  trustSignals: TrustSignal[] = [
    { icon: 'shield-check', title: 'منصة آمنة', text: 'إعلانات وبياعة يخضعوا للمراجعة' },
    { icon: 'badge-check', title: 'بائعون موثوقون', text: 'شارات واضحة للشركات والبياعة المثبتين' },
    { icon: 'map-pin', title: 'سوق تونسي', text: 'أسعار بالدينار وتصفية حسب الولاية' },
  ];

  products: Product[] = [];
  filteredList: Product[] = [];
  pagedList: Product[] = [];
  companies: Company[] = [];

  isLoading = false;
  loadError = '';
  viewMode: ViewMode = 'grid';
  sortValue: SortValue = 'newest';

  activeCategory = 'الكل';
  sellerTypeFilter: SellerTypeFilter = 'all';
  searchQuery = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  filterInStock = false;
  filterFeatured = false;
  filterDelivery = false;
  filterCertified = false;
  filterWilaya = '';
  activeCompany: string | null = null;

  currentPage = 1;
  totalPages = 1;
  pageNumbers: number[] = [];

  sidebarOpen = false;
  searchFocused = false;
  showDetail = false;
  selectedProduct: Product | null = null;

  showAddModal = false;
  addSubmitting = false;
  addStep = 1;
  readonly addStepLabels = ['البائع', 'الصورة', 'الأساسيات', 'السعر والكمية', 'التواصل'];
  readonly addStepHints = [
    'اختار هل الإعلان باسم شخص أو شركة.',
    'حط صورة واضحة للبرودوي باش تزيد الثقة.',
    'اكتب اسم البرودوي، الفئة، الولاية، والمنشأ.',
    'كمّل السعر، نوع السعر، الوحدة، الكمية، والوصف.',
    'حط معلومات التواصل وخيارات الإعلان قبل النشر.',
  ];
  addErrors: Record<string, boolean> = {};
  addForm: AddForm = this.emptyAddForm();

  toast: Toast | null = null;
  private toastTimer?: ReturnType<typeof setTimeout>;
  private favIds = new Set<string>();
  private searchSubject = new Subject<void>();
  private destroy$ = new Subject<void>();
  private pendingOpenAdd = false;
  private lastPublishOpenToken = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    public state: StateService,
  ) {}

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.applyFilter());
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const publish = params.get('publish');
      const token = params.get('open') || publish || '';
      if (publish !== 'product' && publish !== 'product-company') return;
      if (!token || token === this.lastPublishOpenToken) return;
      this.lastPublishOpenToken = token;
      setTimeout(() => {
        if (publish === 'product-company') this.openCompanyAddModal();
        else this.openAddModal();
      }, 80);
    });
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  @HostListener('window:amanafarm-authenticated', ['$event'])
  onAuthenticated(event?: CustomEvent<{ action?: string }>): void {
    const action = event?.detail?.action || sessionStorage.getItem('amanafarm-pending-action');
    if (action === 'product-submit' || action === 'product-submit-company') {
      sessionStorage.removeItem('amanafarm-pending-action');
      setTimeout(() => void this.submitAdd(), 120);
      return;
    }
    if (!this.pendingOpenAdd && action !== 'product-add' && action !== 'product-add-company') return;
    this.pendingOpenAdd = false;
    sessionStorage.removeItem('amanafarm-pending-action');
    setTimeout(() => {
      if (action === 'product-add-company') this.openCompanyAddModal();
      else this.openAddModal();
    }, 80);
  }

  async loadProducts(): Promise<void> {
    this.loadError = '';
    this.products = this.getMockProducts();
    this.companies = this.buildCompanyList();
    this.isLoading = false;
    this.applyFilter();
    this.cdr.markForCheck();

    try {
      const data = await firstValueFrom(
        this.http.get<BackendProduct[]>(`${this.API_BASE}/products`).pipe(timeout(1200)),
      );
      const backendProducts = (data || []).map(p => this.mapBackendProduct(p));
      if (backendProducts.length) {
        this.products = backendProducts;
        this.companies = this.buildCompanyList();
        this.applyFilter();
      }
    } catch {
      this.loadError = '';
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  debouncedFilter(): void { this.searchSubject.next(); }

  applyFilter(): void {
    let list = [...this.products];

    if (this.activeCategory !== 'الكل') list = list.filter(p => p.category === this.activeCategory);
    if (this.sellerTypeFilter !== 'all') list = list.filter(p => p.sellerType === this.sellerTypeFilter);
    if (this.activeCompany) list = list.filter(p => p.companyId === this.activeCompany);

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.companyName?.toLowerCase().includes(q) ?? false) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    }

    if (this.priceMin !== null && this.priceMin !== undefined) list = list.filter(p => p.price >= (this.priceMin as number));
    if (this.priceMax !== null && this.priceMax !== undefined) list = list.filter(p => p.price <= (this.priceMax as number));
    if (this.filterInStock) list = list.filter(p => p.inStock !== false);
    if (this.filterFeatured) list = list.filter(p => p.featured === true);
    if (this.filterDelivery) list = list.filter(p => p.deliveryAvailable === true);
    if (this.filterCertified) list = list.filter(p => p.certified === true);
    if (this.filterWilaya) list = list.filter(p => p.wilaya === this.filterWilaya);

    this.filteredList = this.sortList(list);
    this.currentPage = 1;
    this.paginate();
    this.cdr.markForCheck();
    this.refreshIcons();
  }

  private sortList(list: Product[]): Product[] {
    switch (this.sortValue) {
      case 'cheap': return [...list].sort((a, b) => a.price - b.price);
      case 'expensive': return [...list].sort((a, b) => b.price - a.price);
      case 'rating': return [...list].sort((a, b) => parseFloat(b.sellerRating || '0') - parseFloat(a.sellerRating || '0'));
      case 'newest':
      default: return [...list].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    }
  }

  private paginate(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredList.length / PAGE_SIZE));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    const start = (this.currentPage - 1) * PAGE_SIZE;
    this.pagedList = this.filteredList.slice(start, start + PAGE_SIZE);
    this.buildPageNumbers();
  }

  private buildPageNumbers(): void {
    const total = this.totalPages;
    const cur = this.currentPage;
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) range.push(i);
    if (range[0] > 1) range.unshift(1);
    if (range[range.length - 1] < total) range.push(total);
    this.pageNumbers = range;
  }

  gotoPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.paginate();
    this.scrollToProducts();
    this.cdr.markForCheck();
  }

  filterByCategory(cat: string): void { this.activeCategory = cat; this.applyFilter(); }
  toggleSellerType(type: SellerTypeFilter): void { this.sellerTypeFilter = type; this.applyFilter(); }
  filterByCompany(id: string): void { this.activeCompany = this.activeCompany === id ? null : id; this.applyFilter(); }
  clearCompanyFilter(): void { this.activeCompany = null; this.applyFilter(); }
  clearSearch(): void { this.searchQuery = ''; this.applyFilter(); }

  resetFilters(): void {
    this.activeCategory = 'الكل';
    this.sellerTypeFilter = 'all';
    this.searchQuery = '';
    this.priceMin = null;
    this.priceMax = null;
    this.filterInStock = false;
    this.filterFeatured = false;
    this.filterDelivery = false;
    this.filterCertified = false;
    this.filterWilaya = '';
    this.activeCompany = null;
    this.applyFilter();
  }

  hasActiveFilters(): boolean {
    return this.activeCategory !== 'الكل' || this.sellerTypeFilter !== 'all' || !!this.searchQuery.trim() ||
      this.priceMin !== null || this.priceMax !== null || this.filterInStock || this.filterFeatured ||
      this.filterDelivery || this.filterCertified || !!this.filterWilaya || !!this.activeCompany;
  }

  get activeFiltersCount(): number {
    return [
      this.activeCategory !== 'الكل', this.sellerTypeFilter !== 'all', !!this.searchQuery.trim(),
      this.priceMin !== null, this.priceMax !== null, this.filterInStock, this.filterFeatured,
      this.filterDelivery, this.filterCertified, !!this.filterWilaya, !!this.activeCompany,
    ].filter(Boolean).length;
  }

  get totalProducts(): number { return this.products.length; }
  get totalCompanies(): number { return this.companies.length; }
  get totalIndividuals(): number { return this.products.filter(p => p.sellerType === 'individual').length; }
  get availableWilayas(): string[] { return [...new Set(this.products.map(p => p.wilaya).filter(Boolean) as string[])].sort(); }

  sellerDisplayName(product: Product): string {
    return product.sellerType === 'company'
      ? product.companyName || 'مورد موثوق'
      : product.sellerName || 'بائع موثوق';
  }

  isTrusted(product: Product): boolean {
    return !!(product.companyVerified || product.sellerVerified || product.certified);
  }

  trustLabel(product: Product): string {
    if (product.companyVerified) return 'إعلان مراجع';
    if (product.sellerVerified) return 'بائع موثق';
    if (product.certified) return 'إعلان مراجع';
    return 'قيد المراجعة';
  }

  get formProgress(): number {
    return Math.round((this.addStep / this.addStepLabels.length) * 100);
  }

  getCategoryCount(cat: string): number { return cat === 'الكل' ? this.products.length : this.products.filter(p => p.category === cat).length; }
  getCompany(id: string): Company | undefined { return this.companies.find(c => c.id === id); }

  getPageTitle(): string {
    if (this.activeCompany) return `برودويات ${this.getCompany(this.activeCompany)?.name ?? ''}`;
    if (this.activeCategory !== 'الكل') return this.activeCategory;
    return 'كل البرودويات';
  }

  trackById(_index: number, item: Product): string { return item.id; }
  fmt(price: number): string { return new Intl.NumberFormat('ar-TN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price); }

  formatPriceType(type: PriceType | undefined): string {
    const map: Record<PriceType, string> = {
      FIXED: 'سوم ثابت', NEGOTIABLE: 'قابل للنقاش', PER_KG: 'للكيلو', PER_TON: 'للطن', PER_UNIT: 'للقطعة',
    };
    return type ? map[type] : '';
  }

  categoryIcon(category?: string): string {
    return PROD_CAT_ICONS[category || ''] || 'package';
  }

  productImageClass(product: Product): string {
    return product.imageUrl?.toLowerCase().endsWith('.svg') ? 'pcard__img--vector' : 'pcard__img--photo';
  }

  sellerName(product: Product): string {
    return product.sellerType === 'company'
      ? product.companyName || 'مورد موثوق'
      : product.sellerName || 'بائع موثوق';
  }

  sellerSubtitle(product: Product): string {
    if (product.sellerType === 'company') return product.companyTagline || 'شركة فلاحية على AMANAFARM';
    return product.wilaya ? `بائع من ${product.wilaya}` : 'بائع مباشر';
  }

  sellerVerified(product: Product): boolean {
    return !!(product.companyVerified || product.sellerVerified || product.certified);
  }

  postedLabel(product: Product): string {
    if (!product.createdAt) return 'منذ وقت قريب';
    const diff = Date.now() - new Date(product.createdAt).getTime();
    const days = Math.max(0, Math.floor(diff / 86400000));
    if (days <= 0) return 'اليوم';
    if (days === 1) return 'البارح';
    return `منذ ${days} أيام`;
  }

  similarProducts(product: Product): Product[] {
    return this.products
      .filter(p => p.id !== product.id && (p.category === product.category || p.sellerType === product.sellerType))
      .slice(0, 4);
  }

  isFav(id: string): boolean { return this.favIds.has(id); }

  toggleFav(event: Event, id: string): void {
    event.stopPropagation();
    if (!this.requireLogin()) return;
    if (this.favIds.has(id)) {
      this.favIds.delete(id);
      this.showToast('warn', 'تنحّى من المفضلة');
    } else {
      this.favIds.add(id);
      this.showToast('success', 'تزاد للمفضلة');
    }
    this.cdr.markForCheck();
  }

  openDetail(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedProduct = null;
    document.body.style.overflow = '';
    this.cdr.markForCheck();
  }

  openWa(event: Event, product: Product): void {
    event.stopPropagation();
    if (!product.phone) { this.showToast('warn', 'نمرة التليفون موش موجودة'); return; }
    const raw = product.phone.replace(/\D/g, '');
    const phone = raw.startsWith('216') ? raw : `216${raw}`;
    const msg = encodeURIComponent(`سلام، شفت البرودوي متاعك "${product.name}" في AMANAFARM ونحب نسأل عليه.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener');
  }

  shareProduct(product: Product): void {
    const url = `${window.location.origin}/products/${encodeURIComponent(product.id)}`;
    const text = `${product.name} - ${this.fmt(product.price)} دت`;
    if (navigator.share) navigator.share({ title: product.name, text, url }).catch(() => {});
    else navigator.clipboard.writeText(url).then(() => this.showToast('success', 'الرابط تنسخ'));
  }

  openAddModal(): void {
    this.addForm = this.emptyAddForm();
    this.addErrors = {};
    this.addStep = 1;
    this.showAddModal = true;
    document.body.style.overflow = 'hidden';
    this.cdr.markForCheck();
    setTimeout(() => this.presentAddModal());
  }

  openCompanyAddModal(): void {
    this.addForm = { ...this.emptyAddForm(), sellerType: 'company' };
    if (this.activeCompany) {
      const company = this.getCompany(this.activeCompany);
      this.addForm.companyName = company?.name ?? '';
      this.addForm.companyTagline = company?.description ?? '';
    }
    this.addErrors = {};
    this.addStep = 1;
    this.showAddModal = true;
    document.body.style.overflow = 'hidden';
    this.cdr.markForCheck();
    setTimeout(() => this.presentAddModal());
  }

  private ensureLoggedInForPublish(action: 'product-add' | 'product-add-company'): boolean {
    if (this.state.isLoggedIn()) return true;
    this.pendingOpenAdd = true;
    sessionStorage.setItem('amanafarm-pending-action', action);
    window.dispatchEvent(new CustomEvent('amanafarm-login-required', { detail: { action } }));
    return false;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    document.body.style.overflow = '';
    this.cdr.markForCheck();
  }

  onProdFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { this.showToast('error', 'التصويرة أكبر من 2MB'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      this.addForm.imagePreview = e.target?.result as string;
      this.addForm.imageFile = file;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  removeProductImg(event: Event): void {
    event.stopPropagation();
    this.addForm.imagePreview = '';
    this.addForm.imageFile = undefined;
  }

  setAddStep(step: number): void {
    const next = Math.min(this.addStepLabels.length, Math.max(1, step));
    if (next > this.addStep && !this.validateCurrentAddStep()) return;
    this.addStep = next;
    this.cdr.markForCheck();
    this.refreshIcons();
  }

  nextAddStep(): void {
    this.setAddStep(this.addStep + 1);
  }

  prevAddStep(): void {
    this.addErrors = {};
    this.setAddStep(this.addStep - 1);
  }

  private validateCurrentAddStep(): boolean {
    this.addErrors = {};
    let valid = true;

    if (this.addStep === 1 && this.addForm.sellerType === 'company' && !this.addForm.companyName?.trim()) {
      this.addErrors['companyName'] = true;
      valid = false;
    }

    if (this.addStep === 3) {
      if (!this.addForm.name?.trim()) { this.addErrors['name'] = true; valid = false; }
    }

    if (this.addStep === 4) {
      if (!this.addForm.price || this.addForm.price <= 0) { this.addErrors['price'] = true; valid = false; }
    }

    if (this.addStep === 5) {
      if (!this.addForm.phone?.trim()) { this.addErrors['phone'] = true; valid = false; }
      if (this.addForm.sellerType === 'individual' && !this.addForm.sellerName?.trim()) {
        this.addErrors['sellerName'] = true;
        valid = false;
      }
    }

    if (!valid) {
      this.showToast('error', 'كمّل الخانات المطلوبة في الخطوة هذه');
      this.cdr.markForCheck();
    }
    return valid;
  }

  async submitAdd(): Promise<void> {
    this.addErrors = {};
    let valid = true;
    if (!this.addForm.name?.trim()) { this.addErrors['name'] = true; valid = false; }
    if (!this.addForm.price || this.addForm.price <= 0) { this.addErrors['price'] = true; valid = false; }
    if (!this.addForm.phone?.trim()) { this.addErrors['phone'] = true; valid = false; }
    if (this.addForm.sellerType === 'company' && !this.addForm.companyName?.trim()) { this.addErrors['companyName'] = true; valid = false; }
    if (this.addForm.sellerType === 'individual' && !this.addForm.sellerName?.trim()) { this.addErrors['sellerName'] = true; valid = false; }

    if (!valid) { this.showToast('error', 'عبّي الخانات المطلوبة'); this.cdr.markForCheck(); return; }
    if (!this.requireLogin(this.addForm.sellerType === 'company' ? 'product-submit-company' : 'product-submit')) return;

    this.addSubmitting = true;
    this.cdr.markForCheck();

    try {
      const saved = await firstValueFrom(this.http.post<BackendProduct>(`${this.API_BASE}/products`, this.toBackendPayload()));
      const newProduct = this.mapBackendProduct(saved);
      this.products = [newProduct, ...this.products.filter(p => p.id !== newProduct.id)];
      this.companies = this.buildCompanyList();
      this.applyFilter();
      this.closeAddModal();
      this.showToast('success', 'تم حفظ البرودوي في الخادم بنجاح');
    } catch {
      this.showToast('error', 'تعذر حفظ البرودوي في الخادم. تأكد أن backend و MySQL يعملان');
    } finally {
      this.addSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  showToast(type: ToastType, msg: string, duration = 3500): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { type, msg };
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => { this.toast = null; this.cdr.markForCheck(); }, duration);
  }

  scrollToProducts(): void { document.getElementById('products-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  private presentAddModal(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    const overlay = document.querySelector<HTMLElement>('app-products .modal-overlay.modal-overlay--show, .modal-overlay.modal-overlay--show');
    const card = overlay?.querySelector<HTMLElement>('.add-modal');
    const body = overlay?.querySelector<HTMLElement>('.add-modal__body');
    overlay?.scrollTo({ top: 0, behavior: 'auto' });
    body?.scrollTo({ top: 0, behavior: 'auto' });
    card?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
  }

  private requireLogin(action = ''): boolean {
    if (this.state.user()) return true;
    this.pendingOpenAdd = action.startsWith('product-add');
    if (action) sessionStorage.setItem('amanafarm-pending-action', action);
    window.dispatchEvent(new CustomEvent('amanafarm-login-required', { detail: { action } }));
    const authOverlay = document.getElementById('authOverlay');
    if (authOverlay) {
      authOverlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    this.showToast('warn', 'سجّل الدخول باش تنجم تنشر برودوي');
    return false;
  }

  private emptyAddForm(): AddForm {
    return {
      sellerType: 'individual', companyName: '', companyTagline: '',
      name: '', category: PROD_CATEGORIES[1], price: null, priceType: 'FIXED',
      unit: '', quantity: '', wilaya: '', origin: '', description: '', imagePreview: '', imageFile: undefined,
      inStock: true, deliveryAvailable: false, certified: false, featured: false,
      sellerName: '', phone: '', email: '',
    };
  }

  private buildCompanyList(): Company[] {
    const map = new Map<string, Company>();
    for (const p of this.products) {
      if (p.sellerType !== 'company' || !p.companyId) continue;
      if (!map.has(p.companyId)) {
        map.set(p.companyId, {
          id: p.companyId,
          name: p.companyName ?? '',
          imageUrl: p.imageUrl,
          description: p.companyTagline || `${p.companyName ?? 'المورد'} يوفر برودويات فلاحية مختارة.`,
          category: p.category,
          verified: p.companyVerified ?? false,
          productCount: 0,
        });
      } else if (!map.get(p.companyId)!.imageUrl && p.imageUrl) {
        map.get(p.companyId)!.imageUrl = p.imageUrl;
      }
      map.get(p.companyId)!.productCount++;
    }
    return [...map.values()].sort((a, b) => b.productCount - a.productCount);
  }

  private mapBackendProduct(p: BackendProduct): Product {
    const sellerType: SellerType = p.sellerType === 'company' ? 'company' : 'individual';
    const wilaya = p.wilaya || p.location || '';
    const companyName = p.companyName || '';
    const sellerName = p.sellerName || '';
    return {
      id: String(p.id ?? crypto.randomUUID()),
      name: p.title || p.name || 'برودوي بدون عنوان',
      category: p.category || 'لوازم',
      price: Number(p.price ?? 0),
      priceType: p.priceType || 'FIXED',
      unit: p.unit || undefined,
      quantity: p.quantity || undefined,
      origin: p.origin || undefined,
      wilaya,
      description: p.description || undefined,
      imageUrl: this.normalizeImageUrl(p.imageUrl),
      inStock: p.inStock ?? true,
      featured: p.featured ?? false,
      deliveryAvailable: p.deliveryAvailable ?? false,
      certified: p.certified ?? false,
      sellerType,
      companyId: sellerType === 'company' && companyName ? companyName : undefined,
      companyName: sellerType === 'company' ? companyName || 'شركة فلاحية' : undefined,
      companyTagline: sellerType === 'company' ? p.companyTagline || undefined : undefined,
      companyVerified: p.companyVerified ?? false,
      sellerName: sellerType === 'individual' ? sellerName || 'بائع' : undefined,
      sellerVerified: p.sellerVerified ?? false,
      sellerRating: p.sellerRating || '4.8',
      phone: p.phone || p.contactPhone || '',
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    };
  }

  private toBackendPayload(): ProductPayload {
    const isCompany = this.addForm.sellerType === 'company';
    return {
      title: this.addForm.name.trim(),
      category: this.addForm.category,
      description: this.addForm.description.trim(),
      price: Number(this.addForm.price ?? 0),
      priceType: this.addForm.priceType,
      unit: this.addForm.unit.trim(),
      quantity: this.addForm.quantity.trim(),
      origin: this.addForm.origin.trim(),
      location: this.addForm.wilaya,
      wilaya: this.addForm.wilaya,
      imageUrl: this.addForm.imagePreview,
      contactPhone: this.addForm.phone.replace(/\D/g, ''),
      inStock: this.addForm.inStock,
      featured: this.addForm.featured,
      deliveryAvailable: this.addForm.deliveryAvailable,
      certified: this.addForm.certified,
      sellerType: this.addForm.sellerType,
      companyName: isCompany ? this.addForm.companyName.trim() : '',
      companyTagline: isCompany ? this.addForm.companyTagline.trim() : '',
      companyVerified: isCompany,
      sellerName: isCompany ? '' : this.addForm.sellerName.trim(),
      sellerVerified: !isCompany,
      sellerRating: '4.8',
      userId: null,
    };
  }

  private refreshIcons(): void {
    setTimeout(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 0);
  }

  private normalizeImageUrl(url?: string): string | undefined {
    const raw = String(url || '').trim();
    if (!raw) return undefined;
    if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/uploads/') || raw.startsWith('uploads/')) {
      const clean = raw.startsWith('/') ? raw : `/${raw}`;
      return `${environment.apiBaseUrl}${clean}`;
    }
    return raw.replace(/^\/assets\//, 'assets/');
  }

  private realProductImage(product: Product): string {
    const text = `${product.name} ${product.category}`.toLowerCase();
    const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=82`;
    const byId: Record<string, string> = {
      '1': img('photo-1574323347407-f5e1ad6d020b'),
      '2': img('photo-1585435557343-3b092031a831'),
      '3': img('photo-1527847263472-aa5338d178b8'),
      '4': img('photo-1592924357228-91a4daadcfea'),
      '5': img('photo-1464226184884-fa280b87c399'),
      '6': 'assets/prod-chicken.jpg',
      '7': img('photo-1587049352846-4a222e784d38'),
      '8': img('photo-1500382017468-9049fed747ef'),
      '9': img('photo-1605000797499-95a51c5269ae'),
      '10': img('photo-1518977676601-b53f82aba655'),
      '11': img('photo-1526346698789-22fd84314424'),
      '12': img('photo-1587854692152-cbe660dbde88'),
      '13': 'assets/djj.png',
      '14': img('photo-1500937386664-56d1dfef3854'),
      '15': img('photo-1500937386664-56d1dfef3854'),
      '16': img('photo-1500382017468-9049fed747ef'),
      '17': img('photo-1495107334309-fcf20504a5ab'),
      '18': img('photo-1416879595882-3373a0480b5b'),
      '19': img('photo-1501004318641-b39e6451bec6'),
      '20': img('photo-1474979266404-7eaacbcd87c5'),
      '21': img('photo-1601493700631-2b16ec4b4716'),
    };

    if (byId[product.id]) return byId[product.id];

    if (text.includes('زيت') || text.includes('olive')) return img('photo-1474979266404-7eaacbcd87c5');
    if (text.includes('عسل')) return img('photo-1587049352846-4a222e784d38');
    if (text.includes('تمر')) return img('photo-1601493700631-2b16ec4b4716');
    if (text.includes('طماطم')) return img('photo-1592924357228-91a4daadcfea');
    if (text.includes('بطاطا')) return img('photo-1518977676601-b53f82aba655');
    if (text.includes('فلفل')) return img('photo-1526346698789-22fd84314424');
    if (text.includes('بذور')) return img('photo-1416879595882-3373a0480b5b');
    if (text.includes('محراث') || text.includes('جرار')) return img('photo-1527847263472-aa5338d178b8');
    if (text.includes('مضخة') || text.includes('معدات')) return img('photo-1500937386664-56d1dfef3854');
    if (text.includes('دوا') || text.includes('لقاح') || text.includes('طفيليات') || text.includes('فيتامينات')) return img('photo-1585435557343-3b092031a831');
    if (text.includes('سماد') || text.includes('كومبوست')) return img('photo-1464226184884-fa280b87c399');
    if (text.includes('دواجن')) return 'assets/prod-chicken.jpg';
    if (text.includes('معالف') || text.includes('لوازم') || text.includes('شبك')) return img('photo-1500382017468-9049fed747ef');
    if (text.includes('علف') || text.includes('شعير')) return img('photo-1574323347407-f5e1ad6d020b');
    return img('photo-1500382017468-9049fed747ef');
  }

  private getMockProducts(): Product[] {
    const products: Product[] = [
      {
        id: '1', name: 'علف مركب للأغنام 25كغ', category: 'علف', price: 36, priceType: 'FIXED',
        unit: 'كيس 25كغ', quantity: '200 كيس', wilaya: 'صفاقس', origin: 'تونس', inStock: true,
        featured: true, deliveryAvailable: true, certified: true, sellerType: 'company', companyId: 'smsa',
        companyName: 'SMSA صفاقس', companyVerified: true, phone: '55123456', createdAt: new Date('2024-11-01'),
        imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=900&q=80',
        description: 'علف متوازن للأغنام فيه فيتامينات ومعادن ضرورية.',
      },
      {
        id: '2', name: 'لقاح بيطري معتمد', category: 'دوا بيطري', price: 12, priceType: 'PER_UNIT',
        unit: 'جرعة', quantity: '500 جرعة', wilaya: 'تونس', origin: 'فرنسا', inStock: true,
        certified: true, sellerType: 'company', companyId: 'vetpharma', companyName: 'VetPharma TN',
        companyVerified: true, phone: '71987654', createdAt: new Date('2024-10-15'),
        imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=900&q=80',
      },
      {
        id: '3', name: 'ماكينة حلب آلية', category: 'معدات', price: 1450, priceType: 'NEGOTIABLE',
        wilaya: 'المنستير', origin: 'إيطاليا', inStock: true, sellerType: 'company', companyId: 'agritech',
        companyName: 'AgriTech Maghreb', companyVerified: false, phone: '52111222', createdAt: new Date('2024-09-20'),
        imageUrl: 'https://images.unsplash.com/photo-1527847263472-aa5338d178b8?w=900&q=80',
        description: 'ماكينة حلب أوتوماتيكية مناسبة للمزارع الصغيرة والمتوسطة.',
      },
      {
        id: '4', name: 'بذور طماطم هجينة', category: 'بذور', price: 18, priceType: 'PER_UNIT',
        unit: 'علبة 50 بذرة', wilaya: 'نابل', origin: 'هولندا', inStock: true, certified: true,
        deliveryAvailable: true, sellerType: 'individual', sellerName: 'محمد العجمي', sellerVerified: true,
        sellerRating: '4.9', phone: '98765432', createdAt: new Date('2024-11-10'),
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=900&q=80',
      },
      {
        id: '5', name: 'سماد عضوي كومبوست', category: 'سماد', price: 95, priceType: 'PER_TON',
        unit: 'كيس 50كغ', wilaya: 'القيروان', origin: 'تونس', inStock: true, sellerType: 'individual',
        sellerName: 'فاطمة بن سالم', sellerVerified: false, sellerRating: '4.6', phone: '97543210', createdAt: new Date('2024-10-05'),
        imageUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=80',
      },
      {
        id: '6', name: 'لوازم تربية الدواجن', category: 'لوازم', price: 165, priceType: 'FIXED',
        wilaya: 'أريانة', inStock: false, sellerType: 'company', companyId: 'agritech',
        companyName: 'AgriTech Maghreb', phone: '52111222', createdAt: new Date('2024-08-30'),
        imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=80',
      },
      {
        id: '7', name: 'عسل طبيعي جبلي', category: 'برودويات طبيعية', price: 42, priceType: 'PER_KG',
        wilaya: 'الكاف', origin: 'تونس', inStock: true, certified: true, deliveryAvailable: true,
        sellerType: 'individual', sellerName: 'يوسف الغريبي', sellerVerified: true, sellerRating: '5.0',
        phone: '93123987', createdAt: new Date('2024-11-12'),
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=900&q=80',
        description: 'عسل جبلي طبيعي 100% من مناطق الكاف.',
      },
      {
        id: '8', name: 'علف إبل مركب', category: 'علف', price: 54, priceType: 'FIXED',
        unit: 'كيس 50كغ', wilaya: 'توزر', origin: 'تونس', inStock: true, sellerType: 'company',
        companyId: 'smsa', companyName: 'SMSA صفاقس', companyVerified: true, phone: '55123456', createdAt: new Date('2024-10-22'),
        imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=900&q=80',
      },
      {
        id: '9', name: 'شعير مجروش للتسمين', category: 'علف', price: 48, priceType: 'FIXED',
        unit: 'كيس 40كغ', quantity: '160 كيس', wilaya: 'سيدي بوزيد', origin: 'تونس', inStock: true,
        deliveryAvailable: true, sellerType: 'individual', sellerName: 'علي المكي', sellerVerified: true,
        sellerRating: '4.7', phone: '22444555', createdAt: new Date('2024-11-14'),
        imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=900&q=80',
        description: 'شعير نظيف ومغربل مناسب لتسمين الأغنام والأبقار.',
      },
      {
        id: '10', name: 'بذور بطاطا موسمية', category: 'بذور', price: 135, priceType: 'PER_UNIT',
        unit: 'قنطار', quantity: '40 قنطار', wilaya: 'جندوبة', origin: 'تونس', inStock: true,
        certified: true, sellerType: 'company', companyId: 'green-seeds', companyName: 'Green Seeds TN',
        companyVerified: true, phone: '71222444', createdAt: new Date('2024-11-08'),
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=900&q=80',
        description: 'بذور بطاطا منتقاة للموسم الشتوي مع شهادة جودة.',
      },
      {
        id: '11', name: 'بذور فلفل حار', category: 'بذور', price: 24, priceType: 'PER_UNIT',
        unit: 'ظرف 100 بذرة', wilaya: 'نابل', origin: 'تونس', inStock: true,
        deliveryAvailable: true, sellerType: 'individual', sellerName: 'سمير بن عمر', sellerVerified: false,
        sellerRating: '4.4', phone: '55666777', createdAt: new Date('2024-10-28'),
        imageUrl: 'https://images.unsplash.com/photo-1526346698789-22fd84314424?w=900&q=80',
      },
      {
        id: '12', name: 'مضاد طفيليات للأغنام', category: 'دوا بيطري', price: 38, priceType: 'PER_UNIT',
        unit: 'قارورة 100مل', quantity: '90 قارورة', wilaya: 'سوسة', origin: 'إسبانيا', inStock: true,
        certified: true, sellerType: 'company', companyId: 'vetpharma', companyName: 'VetPharma TN',
        companyVerified: true, phone: '71987654', createdAt: new Date('2024-11-05'),
        imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=900&q=80',
        description: 'منتج بيطري مراجع للاستعمال تحت إشراف مختص.',
      },
      {
        id: '13', name: 'فيتامينات دواجن', category: 'دوا بيطري', price: 26, priceType: 'FIXED',
        unit: 'علبة', wilaya: 'بن عروس', origin: 'تونس', inStock: true,
        sellerType: 'individual', sellerName: 'نادر الشابي', sellerVerified: true,
        sellerRating: '4.8', phone: '50777888', createdAt: new Date('2024-10-18'),
        imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=900&q=80',
      },
      {
        id: '14', name: 'محراث صغير للجرار', category: 'معدات', price: 1850, priceType: 'NEGOTIABLE',
        wilaya: 'باجة', origin: 'تركيا', inStock: true, deliveryAvailable: true,
        sellerType: 'company', companyId: 'agritech', companyName: 'AgriTech Maghreb',
        companyVerified: true, phone: '52111222', createdAt: new Date('2024-11-02'),
        imageUrl: 'https://images.unsplash.com/photo-1527847263472-aa5338d178b8?w=900&q=80',
        description: 'محراث قوي للأراضي المتوسطة، يصلح للجرارات الصغيرة.',
      },
      {
        id: '15', name: 'مضخة ماء فلاحية', category: 'معدات', price: 690, priceType: 'FIXED',
        wilaya: 'قابس', origin: 'إيطاليا', inStock: true, sellerType: 'individual',
        sellerName: 'رياض الدريدي', sellerVerified: true, sellerRating: '4.6',
        phone: '28889900', createdAt: new Date('2024-09-28'),
        imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=900&q=80',
      },
      {
        id: '16', name: 'معالف بلاستيك للأغنام', category: 'لوازم', price: 35, priceType: 'PER_UNIT',
        unit: 'قطعة', quantity: '75 قطعة', wilaya: 'القصرين', origin: 'تونس', inStock: true,
        sellerType: 'company', companyId: 'farm-tools', companyName: 'FarmTools Tunisie',
        companyVerified: true, phone: '73444555', createdAt: new Date('2024-11-11'),
        imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80',
        description: 'معالف خفيفة وسهلة التنظيف للحظائر الصغيرة.',
      },
      {
        id: '17', name: 'شبك حماية للمزرعة', category: 'لوازم', price: 95, priceType: 'FIXED',
        unit: 'لفة 25م', wilaya: 'مدنين', origin: 'تونس', inStock: true,
        deliveryAvailable: true, sellerType: 'individual', sellerName: 'خالد التومي',
        sellerVerified: false, sellerRating: '4.3', phone: '29990011', createdAt: new Date('2024-10-02'),
        imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80',
      },
      {
        id: '18', name: 'سماد NPK متوازن', category: 'سماد', price: 92, priceType: 'FIXED',
        unit: 'كيس 50كغ', quantity: '120 كيس', wilaya: 'صفاقس', origin: 'تونس', inStock: true,
        certified: true, sellerType: 'company', companyId: 'green-seeds', companyName: 'Green Seeds TN',
        companyVerified: true, phone: '71222444', createdAt: new Date('2024-11-09'),
        imageUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=80',
        description: 'سماد مناسب للخضر والأشجار المثمرة مع استعمال واضح.',
      },
      {
        id: '19', name: 'سماد أغنام طبيعي', category: 'سماد', price: 80, priceType: 'PER_TON',
        unit: 'طن', wilaya: 'سليانة', origin: 'تونس', inStock: true,
        sellerType: 'individual', sellerName: 'منصف السليتي', sellerVerified: true,
        sellerRating: '4.9', phone: '93334455', createdAt: new Date('2024-10-24'),
        imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80',
      },
      {
        id: '20', name: 'زيت زيتون بكر ممتاز', category: 'برودويات طبيعية', price: 24, priceType: 'PER_KG',
        unit: 'لتر', quantity: '300 لتر', wilaya: 'المهدية', origin: 'تونس', inStock: true,
        certified: true, deliveryAvailable: true, sellerType: 'company', companyId: 'natural-farm',
        companyName: 'Natural Farm', companyVerified: true, phone: '74222111', createdAt: new Date('2024-11-15'),
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=900&q=80',
        description: 'زيت زيتون تونسي من العصر الأول، مناسب للبيع بالجملة.',
      },
      {
        id: '21', name: 'تمر دقلة نور', category: 'برودويات طبيعية', price: 14, priceType: 'PER_KG',
        unit: 'كغ', wilaya: 'قبلي', origin: 'تونس', inStock: true,
        sellerType: 'individual', sellerName: 'حياة النفزاوي', sellerVerified: true,
        sellerRating: '4.8', phone: '95556677', createdAt: new Date('2024-11-07'),
        imageUrl: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=900&q=80',
        description: 'تمر دقلة نور جودة ممتازة، متوفر للتفصيل والجملة.',
      },
      {
        id: '22', name: 'طماطم موسمية من نابل', category: 'خضر', price: 2.8, priceType: 'PER_KG',
        unit: 'كغ', quantity: '1 طن', wilaya: 'نابل', origin: 'تونس', inStock: true,
        certified: true, deliveryAvailable: true, sellerType: 'individual', sellerName: 'فلاح نابل',
        sellerVerified: true, sellerRating: '4.7', phone: '55111222', createdAt: new Date('2024-11-16'),
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=900&q=80',
        description: 'طماطم موسمية طازجة من نابل، مناسبة للمطاعم والتجار.',
      },
      {
        id: '23', name: 'بطاطا موسمية من جندوبة', category: 'خضر', price: 2.2, priceType: 'PER_KG',
        unit: 'كغ', quantity: '2 طن', wilaya: 'جندوبة', origin: 'تونس', inStock: true,
        deliveryAvailable: true, sellerType: 'company', companyId: 'north-farm',
        companyName: 'North Farm', companyVerified: true, phone: '55222333', createdAt: new Date('2024-11-13'),
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=900&q=80',
        description: 'بطاطا نظيفة ومفرزة، متوفرة بكميات للتجار.',
      },
      {
        id: '24', name: 'فلفل حار تونسي', category: 'خضر', price: 5.5, priceType: 'PER_KG',
        unit: 'كغ', quantity: '350 كغ', wilaya: 'القيروان', origin: 'تونس', inStock: true,
        sellerType: 'individual', sellerName: 'سليم القيرواني', sellerVerified: true,
        sellerRating: '4.6', phone: '55333444', createdAt: new Date('2024-11-06'),
        imageUrl: 'https://images.unsplash.com/photo-1526346698789-22fd84314424?w=900&q=80',
        description: 'فلفل حار تونسي بنكهة قوية، مناسب للصناعات الغذائية.',
      },
      {
        id: '25', name: 'سماد عضوي تونسي', category: 'سماد', price: 95, priceType: 'PER_TON',
        unit: 'طن', quantity: '12 طن', wilaya: 'سليانة', origin: 'تونس', inStock: true,
        sellerType: 'company', companyId: 'bio-sol', companyName: 'BioSol Tunisie',
        companyVerified: true, phone: '55444555', createdAt: new Date('2024-10-30'),
        imageUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=80',
        description: 'سماد عضوي مخمر ومناسب للأشجار والخضروات.',
      },
      {
        id: '26', name: 'مضخة ماء فلاحية', category: 'معدات', price: 690, priceType: 'FIXED',
        unit: 'وحدة', quantity: '8 وحدات', wilaya: 'قابس', origin: 'إيطاليا', inStock: true,
        deliveryAvailable: true, sellerType: 'individual', sellerName: 'رياض الدريدي',
        sellerVerified: true, sellerRating: '4.6', phone: '28889900', createdAt: new Date('2024-09-28'),
        imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=900&q=80',
        description: 'مضخة ماء فلاحية مناسبة للري بالتنقيط والآبار الصغيرة.',
      },
    ];

    return products.map(product => ({
      ...product,
      imageUrl: this.realProductImage(product),
    }));
  }
}
