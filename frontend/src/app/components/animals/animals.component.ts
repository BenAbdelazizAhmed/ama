import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnInit,
  OnDestroy,
  NgZone,
  HostListener,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StateService } from '../../services/state.service';

declare const lucide: any;

export interface AnimalResponse {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  priceType: string;
  wilaya: string;
  zone: string;
  age: string;
  gender: string;
  healthStatus: string;
  phone: string;
  contactMethod: string;
  deliveryAvailable: boolean;
  vetCertificate: boolean;
  featured: boolean;
  trustedSeller: boolean;
  status: string;
  userId: number;
  createdAt: string;
  images: string[];
  mainImageUrl?: string;
  imageUrls?: string[];
  sellerName?: string;
  sellerRating?: number;
}

export interface AnimalRequest {
  title: string;
  description: string;
  category: string;
  price: number;
  priceType: string;
  wilaya: string;
  zone: string;
  age: string;
  gender: string;
  healthStatus: string;
  phone: string;
  contactMethod: string;
  deliveryAvailable: boolean;
  vetCertificate: boolean;
  featured: boolean;
  trustedSeller: boolean;
  sellerName: string;
}

interface ToastMsg {
  msg: string;
  type: 'success' | 'error' | 'info' | 'warn';
}

@Component({
  selector: 'app-animals',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './animals.component.html',
  styleUrls: ['./animals-component.css'],
})
export class AnimalsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('marketSection') marketSectionRef!: ElementRef;

  private readonly API = `${environment.apiBaseUrl}/api/animals`;

  animals: AnimalResponse[] = [];
  filteredList: AnimalResponse[] = [];
  pagedList: AnimalResponse[] = [];

  isLoading = false;
  loadError = '';

  currentPage = 1;
  readonly PAGE_SIZE = 12;
  totalPages = 1;

  activeCategory = 'الكل';
  saleFilter: 'all' | 'single' | 'bulk' = 'all';
  addListingMode: 'single' | 'bulk' = 'single';
  activeWholesaleSupplier: string | null = null;
  sortValue = 'newest';
  searchQuery = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  bulkHeads: number | null = null;

  favIds = new Set<number>();
  showAddModal = false;
  publishStep = 1;

  addForm = this.freshForm();
  addErrors: Record<string, boolean> = {};
  addSubmitting = false;
  imgPreviews: string[] = [];
  imgFiles: File[] = [];

  toast: ToastMsg | null = null;
  private toastTimer: any;
  private filterTimer: any;
  private pendingOpenAdd = false;
  private lastPublishOpenToken = '';

  readonly CATEGORIES = [
    'الكل', 'أغنام', 'أبقار', 'ماعز', 'دواجن', 'خيول', 'جمال', 'أرانب',
  ];

  readonly wholesaleSuppliers = [
    {
      id: 'rahbet-warda',
      name: 'رحبة وردة',
      category: 'أغنام',
      wilaya: 'سيدي بوزيد',
      offer: 'قطعان نعاج وخرفان بالجملة',
      count: 18,
      imageUrl: 'assets/prod-sheep.jpg',
    },
    {
      id: 'fermet-elbaraka',
      name: 'فرمة البركة',
      category: 'دواجن',
      wilaya: 'بن عروس',
      offer: 'كتاكيت ودجاج بلدي بالجملة',
      count: 120,
      imageUrl: 'assets/prod-chicken.jpg',
    },
    {
      id: 'fermet-ennour',
      name: 'فرمة النور',
      category: 'ماعز',
      wilaya: 'نابل',
      offer: 'ماعز حلوبة وجديان للتربية',
      count: 24,
      imageUrl: 'assets/prod-goat.jpg',
    },
    {
      id: 'souq-elkef',
      name: 'سوق الكاف',
      category: 'أبقار',
      wilaya: 'الكاف',
      offer: 'عجول وأبقار للتسمين',
      count: 14,
      imageUrl: 'assets/prod-cow.jpg',
    },
    {
      id: 'djej-sfax',
      name: 'دجاج صفاقس',
      category: 'دواجن',
      wilaya: 'صفاقس',
      offer: 'دجاج وكتاكيت بالكميات',
      count: 200,
      imageUrl: 'assets/djj.png',
    },
    {
      id: 'arneb-sahel',
      name: 'أرانب الساحل',
      category: 'أرانب',
      wilaya: 'المنستير',
      offer: 'أرانب منتجة بالجملة',
      count: 60,
      imageUrl: 'assets/arnb.png',
    },
  ];

  readonly CAT_EMOJIS: Record<string, string> = {
    'الكل': 'الكل',
    'أغنام': 'أغنام',
    'أبقار': 'أبقار',
    'ماعز': 'ماعز',
    'دواجن': 'دواجن',
    'خيول': 'خيول',
    'جمال': 'جمال',
    'أرانب': 'أرانب',
  };

  readonly WILAYAS = [
    'تونس', 'أريانة', 'بن عروس', 'منوبة', 'نابل', 'زغوان', 'بنزرت',
    'باجة', 'جندوبة', 'الكاف', 'سليانة', 'سوسة', 'المنستير', 'المهدية',
    'صفاقس', 'القيروان', 'القصرين', 'سيدي بوزيد', 'مدنين', 'تطاوين',
    'قابس', 'قفصة', 'توزر', 'قبلي',
  ];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private zone: NgZone,
    public state: StateService,
  ) {}

  ngOnInit() {
    this.loadFavs();
    this.route.queryParamMap.subscribe(params => {
      const publish = params.get('publish');
      const token = params.get('open') || publish || '';
      if (publish !== 'animal' && publish !== 'animal-bulk') return;
      if (!token || token === this.lastPublishOpenToken) return;
      this.lastPublishOpenToken = token;
      setTimeout(() => this.openAddModal(publish === 'animal-bulk' ? 'bulk' : 'single'), 80);
    });
    this.loadAnimals();
  }

  @HostListener('window:amanafarm-authenticated', ['$event'])
  onAuthenticated(event?: CustomEvent<{ action?: string }>): void {
    const action = event?.detail?.action || sessionStorage.getItem('amanafarm-pending-action');
    if (!this.pendingOpenAdd && action !== 'animal-add' && action !== 'animal-add-bulk') return;
    this.pendingOpenAdd = false;
    sessionStorage.removeItem('amanafarm-pending-action');
    setTimeout(() => this.openAddModal(action === 'animal-add-bulk' ? 'bulk' : 'single'), 80);
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  ngOnDestroy() {
    clearTimeout(this.filterTimer);
    clearTimeout(this.toastTimer);
  }

  loadAnimals() {
    this.loadError = '';
    this.animals = [];
    this.filteredList = [];
    this.pagedList = [];
    this.isLoading = true;
    this.applyFilter();
    setTimeout(() => this.refreshIcons());

    this.http.get<AnimalResponse[]>(this.API).pipe(timeout(10000)).subscribe({
      next: (data) => {
        this.zone.run(() => {
          const realAnimals = (data ?? []).map(a => this.normalise(a));
          this.animals = realAnimals.length ? realAnimals : this.getMockAnimals();
          this.isLoading = false;
          this.applyFilter();
          setTimeout(() => this.refreshIcons());
        });
      },
      error: () => {
        this.zone.run(() => {
          this.animals = this.getMockAnimals();
          this.isLoading = false;
          this.loadError = '';
          this.applyFilter();
          setTimeout(() => this.refreshIcons());
        });
      },
    });
  }

  private normalise(a: AnimalResponse): AnimalResponse {
    const rawImages: any[] = Array.isArray(a.images) ? a.images : [];
    const imageUrls: string[] = rawImages
      .map((img: any) => {
        if (typeof img === 'string') return img;
        if (img && typeof img === 'object') return img.imageUrl ?? img.url ?? img.src ?? '';
        return '';
      })
      .filter(Boolean);

    const existingMain = a.mainImageUrl || a.imageUrls?.[0] || '';
    const normalizedImages = imageUrls.length ? imageUrls : (existingMain ? [existingMain] : []);
    const mainImageUrl = normalizedImages[0] || this.realAnimalImage(a.category, a.title, a.id);

    return { ...a, images: normalizedImages, imageUrls: normalizedImages, mainImageUrl };
  }

  setAnimalImageFallback(ad: AnimalResponse): void {
    const fallback = this.realAnimalImage(ad.category, ad.title, ad.id);
    ad.mainImageUrl = fallback;
    ad.imageUrls = [fallback, ...(ad.imageUrls || []).filter(url => url && url !== fallback)];
    ad.images = ad.imageUrls;
  }

  applyFilter() {
    this.currentPage = 1;
    let list = [...this.animals];

    if (this.activeWholesaleSupplier) {
      const supplier = this.wholesaleSuppliers.find(s => s.id === this.activeWholesaleSupplier);
      if (supplier) {
        list = list.filter(a => this.isBulkAd(a) && a.sellerName === supplier.name);
      }
    }

    if (this.activeCategory !== 'الكل') {
      list = list.filter(a => a.category === this.activeCategory);
    }

    if (this.saleFilter === 'single') {
      list = list.filter(a => !this.isBulkAd(a));
    } else if (this.saleFilter === 'bulk') {
      list = list.filter(a => this.isBulkAd(a));
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(a =>
        [a.title, a.category, a.wilaya, a.zone, a.sellerName ?? '']
          .join(' ').toLowerCase().includes(q)
      );
    }

    if (this.priceMin !== null && this.priceMin >= 0) list = list.filter(a => a.price >= (this.priceMin as number));
    if (this.priceMax !== null && this.priceMax > 0) list = list.filter(a => a.price <= (this.priceMax as number));

    if (this.sortValue === 'cheap') list.sort((a, b) => a.price - b.price);
    else if (this.sortValue === 'expensive') list.sort((a, b) => b.price - a.price);

    this.filteredList = list;
    this.totalPages = Math.max(1, Math.ceil(list.length / this.PAGE_SIZE));
    this.buildPage();
    setTimeout(() => this.refreshIcons());
  }

  debouncedFilter() {
    clearTimeout(this.filterTimer);
    this.filterTimer = setTimeout(() => this.applyFilter(), 300);
  }

  buildPage() {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    this.pagedList = this.filteredList.slice(start, start + this.PAGE_SIZE);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set<number>([1, total, cur, cur - 1, cur + 1]);
    return [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  }

  filterByCategory(cat: string) {
    this.activeCategory = cat;
    this.applyFilter();
  }

  filterBySale(type: 'all' | 'single' | 'bulk') {
    this.saleFilter = type;
    if (type !== 'bulk') this.activeWholesaleSupplier = null;
    this.applyFilter();
  }

  filterSaleAll() { this.filterBySale('all'); }
  filterSaleSingle() { this.filterBySale('single'); }
  filterSaleBulk() { this.filterBySale('bulk'); }

  browseWholesaleSupplier(supplier: { id: string; category: string }) {
    this.activeWholesaleSupplier = supplier.id;
    this.saleFilter = 'bulk';
    this.activeCategory = supplier.category;
    this.searchQuery = '';
    this.applyFilter();
    setTimeout(() => this.scrollToMarket(), 40);
  }

  browseAllWholesale() {
    this.activeWholesaleSupplier = null;
    this.saleFilter = 'bulk';
    this.activeCategory = 'الكل';
    this.searchQuery = '';
    this.applyFilter();
    setTimeout(() => this.scrollToMarket(), 40);
  }

  get saleAllActive(): boolean { return this.saleFilter === 'all'; }
  get saleSingleActive(): boolean { return this.saleFilter === 'single'; }
  get saleBulkActive(): boolean { return this.saleFilter === 'bulk'; }

  isSaleAll(): boolean { return this.saleFilter === 'all'; }
  isSaleSingle(): boolean { return this.saleFilter === 'single'; }
  isSaleBulk(): boolean { return this.saleFilter === 'bulk'; }

  isBulkAd(ad: AnimalResponse): boolean {
    const text = `${ad.title || ''} ${ad.description || ''}`.toLowerCase();
    return text.includes('بيع بالجملة') || text.includes('جملة') || text.includes('قطيع') || text.includes('[bulk]');
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilter();
  }

  resetFilters() {
    this.activeCategory = 'الكل';
    this.saleFilter = 'all';
    this.activeWholesaleSupplier = null;
    this.searchQuery = '';
    this.priceMin = null;
    this.priceMax = null;
    this.sortValue = 'newest';
    this.applyFilter();
  }

  gotoPage(n: number) {
    if (n < 1 || n > this.totalPages) return;
    this.currentPage = n;
    this.buildPage();
    this.marketSectionRef?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getCatCount(cat: string): number {
    if (cat === 'الكل') return this.animals.length;
    return this.animals.filter(a => a.category === cat).length;
  }

  get totalAds(): number { return this.animals.length; }

  get totalBulkAds(): number {
    return this.animals.filter(a => this.isBulkAd(a)).length;
  }

  get totalSingleAds(): number {
    return this.animals.filter(a => !this.isBulkAd(a)).length;
  }

  getWholesaleSupplierCount(supplierName: string): number {
    return this.animals.filter(a => this.isBulkAd(a) && a.sellerName === supplierName).length;
  }

  get avgPrice(): number {
    if (!this.animals.length) return 0;
    return Math.round(this.animals.reduce((s, a) => s + (a.price ?? 0), 0) / this.animals.length);
  }

  get verifiedCount(): number {
    return this.animals.filter(a => a.trustedSeller).length;
  }

  goToDetail(event: Event, ad: AnimalResponse) {
    event.stopPropagation();
    this.router.navigate(['/animals', ad.id]);
  }

  loadFavs() {
    try {
      const raw = localStorage.getItem('animal_favs');
      if (raw) this.favIds = new Set(JSON.parse(raw));
    } catch {}
  }

  saveFavs() {
    try {
      localStorage.setItem('animal_favs', JSON.stringify([...this.favIds]));
    } catch {}
  }

  toggleFav(event: Event, id: number) {
    event.stopPropagation();
    if (!this.requireLogin()) return;
    if (this.favIds.has(id)) {
      this.favIds.delete(id);
      this.showToast('تنحّى من المفضلة', 'info');
    } else {
      this.favIds.add(id);
      this.showToast('تزاد للمفضلة');
    }
    this.saveFavs();
  }

  isFav(id: number): boolean { return this.favIds.has(id); }

  openWa(event: Event, ad: AnimalResponse) {
    event.stopPropagation();
    let phone = String(ad.phone ?? '').replace(/\D/g, '');
    if (!phone) { this.showToast('نمرة التليفون موش موجودة', 'error'); return; }
    if (phone.length === 8) phone = '216' + phone;
    const msg = encodeURIComponent(
      `سلام، شفت الإعلان هذا في AMANAFARM: ${ad.title} بسوم ${this.fmt(ad.price)} دت في ${ad.wilaya}`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  }

  openAddModal(mode: 'single' | 'bulk' = 'single') {
    if (!this.ensureLoggedInForPublish(mode)) return;
    this.addListingMode = mode;
    this.addForm = this.freshForm();
    if (mode === 'bulk') {
      this.addForm.title = 'قطيع للبيع بالجملة';
      this.addForm.priceType = 'PER_HEAD';
      this.addForm.description = 'بيع بالجملة: ';
    }
    this.bulkHeads = null;
    this.addErrors = {};
    this.imgPreviews = [];
    this.imgFiles = [];
    this.publishStep = 1;
    this.showAddModal = true;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('animal-publish-open');
    setTimeout(() => {
      this.presentAddModal();
      this.refreshIcons();
    });
  }

  openSingleAddModal() { this.openAddModal('single'); }
  openBulkAddModal() { this.openAddModal('bulk'); }

  private ensureLoggedInForPublish(mode: 'single' | 'bulk'): boolean {
    if (this.state.isLoggedIn()) return true;
    const action = mode === 'bulk' ? 'animal-add-bulk' : 'animal-add';
    this.pendingOpenAdd = true;
    sessionStorage.setItem('amanafarm-pending-action', action);
    window.dispatchEvent(new CustomEvent('amanafarm-login-required', { detail: { action } }));
    return false;
  }

  setAddListingMode(mode: 'single' | 'bulk') {
    this.addListingMode = mode;
    if (mode === 'bulk') {
      if (!this.addForm.title.trim()) this.addForm.title = 'قطيع للبيع بالجملة';
      this.addForm.priceType = 'PER_HEAD';
      if (!this.addForm.description.trim()) this.addForm.description = 'بيع بالجملة: ';
    } else {
      if (this.addForm.title === 'قطيع للبيع بالجملة') this.addForm.title = '';
      if (this.addForm.description === 'بيع بالجملة: ') this.addForm.description = '';
      this.bulkHeads = null;
    }
  }

  setSingleListingMode() { this.setAddListingMode('single'); }
  setBulkListingMode() { this.setAddListingMode('bulk'); }

  scrollToMarket() {
    this.marketSectionRef?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private presentAddModal(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    const overlay = document.querySelector<HTMLElement>('app-animals .modal-overlay.show, .modal-overlay.show');
    const card = overlay?.querySelector<HTMLElement>('.publish-flow-card, .modal-card');
    const body = overlay?.querySelector<HTMLElement>('.modal-body');
    overlay?.scrollTo({ top: 0, behavior: 'auto' });
    body?.scrollTo({ top: 0, behavior: 'auto' });
    card?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
  }

  closeAddModal() {
    this.showAddModal = false;
    this.publishStep = 1;
    document.body.style.overflow = '';
    document.body.classList.remove('animal-publish-open');
  }

  goPublishStep(step: number) {
    this.publishStep = Math.min(4, Math.max(1, step));
    setTimeout(() => this.refreshIcons());
  }

  nextPublishStep() {
    if (this.publishStep === 2 && !this.validateAnimalStep()) {
      this.showToast('كمّل عنوان الإعلان والسعر', 'warn');
      return;
    }
    this.goPublishStep(this.publishStep + 1);
  }

  prevPublishStep() {
    this.goPublishStep(this.publishStep - 1);
  }

  freshForm(): AnimalRequest & { sellerName: string } {
    return {
      title: '', description: '', category: 'أغنام', price: 0,
      priceType: 'FIXED', wilaya: 'تونس', zone: '', age: '',
      gender: 'ذكر', healthStatus: 'ممتازة', phone: '',
      contactMethod: 'WHATSAPP', deliveryAvailable: false,
      vetCertificate: false, featured: false, trustedSeller: false,
      sellerName: '',
    };
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.handleFiles(Array.from(input.files));
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) this.handleFiles(Array.from(event.dataTransfer.files));
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

  handleFiles(files: File[]) {
    const maxSize = 2 * 1024 * 1024;
    const valid = files.filter(f => f.type.startsWith('image/') && f.size <= maxSize);
    const oversized = files.filter(f => f.size > maxSize);

    if (oversized.length) this.showToast(`${oversized.length} تصويرة أكبر من 2MB`, 'warn');
    if (valid.length + this.imgFiles.length > 5) { this.showToast('تنجم تضيف كان 5 تصاور', 'warn'); return; }

    const combined = [...this.imgFiles, ...valid].slice(0, 5);
    this.imgFiles = combined;
    this.imgPreviews = [];
    combined.forEach((f, i) => {
      const reader = new FileReader();
      reader.onload = e => this.zone.run(() => { this.imgPreviews[i] = e.target?.result as string; });
      reader.readAsDataURL(f);
    });
  }

  removeImg(i: number) {
    this.imgFiles.splice(i, 1);
    this.imgPreviews.splice(i, 1);
  }

  validateAdd(): boolean {
    this.addErrors = {};
    if (!this.addForm.title.trim()) this.addErrors['title'] = true;
    if (!this.addForm.price || Number(this.addForm.price) <= 0) this.addErrors['price'] = true;
    if (!this.addForm.sellerName.trim()) this.addErrors['sellerName'] = true;
    if (!this.addForm.phone.trim()) this.addErrors['phone'] = true;
    return Object.keys(this.addErrors).length === 0;
  }

  validateAnimalStep(): boolean {
    this.addErrors = {};
    if (!this.addForm.title.trim()) this.addErrors['title'] = true;
    if (!this.addForm.price || Number(this.addForm.price) <= 0) this.addErrors['price'] = true;
    return !this.addErrors['title'] && !this.addErrors['price'];
  }

  submitAdd() {
    if (!this.requireLogin()) return;
    if (!this.validateAdd()) { this.showToast('عبّي الخانات المطلوبة', 'warn'); return; }
    this.addSubmitting = true;

    const body: AnimalRequest = {
      ...this.addForm,
      title: this.addListingMode === 'bulk' && !this.addForm.title.includes('جملة')
        ? `${this.addForm.title} - بيع بالجملة`
        : this.addForm.title,
      description: this.addListingMode === 'bulk'
        ? `${this.addForm.description || ''}${this.bulkHeads ? `\nعدد الرؤوس: ${this.bulkHeads}` : ''}\n[bulk]`
        : this.addForm.description,
      price: Number(this.addForm.price),
    };

    this.http.post<AnimalResponse>(this.API, body).subscribe({
      next: (created) => {
        this.zone.run(() => {
          if (this.imgFiles.length > 0) this.uploadImages(created.id, this.imgFiles, () => this.onSubmitSuccess(created));
          else this.onSubmitSuccess(created);
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.addSubmitting = false;
          this.showToast(err.error?.message ?? 'ما تنجمش تنشر الإعلان توا', 'error');
        });
      },
    });
  }

  private onSubmitSuccess(created: AnimalResponse) {
    this.animals = [this.normalise(created), ...this.animals];
    this.applyFilter();
    this.addSubmitting = false;
    this.closeAddModal();
    this.showToast('الإعلان تهبط بنجاح');
  }

  private uploadImages(animalId: number, files: File[], onDone: () => void) {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f, f.name));
    this.http.post<{ imageUrls: string[] }>(`${this.API}/${animalId}/images`, formData).subscribe({
      next: () => onDone(),
      error: (err) => {
        console.error('Image upload error:', err);
        this.showToast('الإعلان تهبط، أما التصاور ما طلعوش الكل', 'warn');
        onDone();
      },
    });
  }

  showToast(msg: string, type: ToastMsg['type'] = 'success') {
    this.toast = { msg, type };
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { this.toast = null; }, 3500);
  }

  fmt(n: string | number): string {
    const num = Number(n ?? 0);
    return isNaN(num) ? '-' : num.toLocaleString('ar-TN');
  }

  formatPriceType(type: string): string {
    const map: Record<string, string> = {
      FIXED: 'سوم ثابت', NEGOTIABLE: 'قابل للنقاش',
      PER_HEAD: 'للراس', PER_KG: 'للكيلو',
    };
    return map[type] ?? type;
  }

  getHealthLabel(status: string): string {
    const map: Record<string, string> = { 'ممتازة': 'ممتازة', 'جيد': 'باهي', 'عادي': 'عادي' };
    return map[status] ?? status;
  }

  trackById(_: number, item: AnimalResponse): number { return item.id; }

  private refreshIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  private requireLogin(action = ''): boolean {
    if (this.state.user()) return true;
    this.pendingOpenAdd = action === 'animal-add';
    if (action) sessionStorage.setItem('amanafarm-pending-action', action);
    window.dispatchEvent(new CustomEvent('amanafarm-login-required', { detail: { action } }));
    return false;
  }

  private realAnimalImage(category: string, title = '', id = 0): string {
    const text = `${category} ${title}`.toLowerCase();
    const pick = (images: string[]) => images[Math.abs(id) % images.length];

    if (text.includes('دواجن') || text.includes('دجاج') || text.includes('كتاكيت')) {
      return pick(['assets/prod-chicken.jpg', 'assets/djj.png', 'assets/coq.png', 'assets/cok.png']);
    }
    if (text.includes('أبقار') || text.includes('عجلة') || text.includes('ثور') || text.includes('عجول')) {
      return pick(['assets/prod-cow.jpg', 'assets/bagra.png', 'assets/bagraa.jpg']);
    }
    if (text.includes('ماعز') || text.includes('جدي')) {
      return pick(['assets/prod-goat.jpg', 'assets/ba3.png', 'https://images.unsplash.com/photo-1524024973431-2ad916746881?w=900&q=80']);
    }
    if (text.includes('خيول') || text.includes('فرس') || text.includes('مهر')) {
      return pick(['assets/fafa.png', 'assets/fa.png', 'assets/f1.png']);
    }
    if (text.includes('جمال') || text.includes('ناقة') || text.includes('جمل')) {
      return pick(['assets/ds.png', 'assets/frm.png', 'assets/ft.png']);
    }
    if (text.includes('أرانب')) {
      return pick(['assets/arnb.png', 'assets/woa.png', 'assets/waas.png']);
    }
    if (text.includes('أغنام') || text.includes('خروف') || text.includes('نعاج')) {
      return pick(['assets/prod-sheep.jpg', 'assets/hero-sheep.png', 'assets/za.png', 'assets/ba3.png']);
    }
    return pick(['assets/prod-sheep.jpg', 'assets/prod-cow.jpg', 'assets/prod-goat.jpg']);
  }

  private getMockAnimals(): AnimalResponse[] {
    const now = new Date();
    const item = (
      id: number,
      title: string,
      category: string,
      price: number,
      wilaya: string,
      zone: string,
      extra: Partial<AnimalResponse> = {},
    ): AnimalResponse => {
      const realImage = this.realAnimalImage(category, title, id);
      return {
        id,
        title,
        description: extra.description || 'إعلان واضح بمعلومات أساسية وصور حقيقية للتواصل المباشر.',
        category,
        price,
        priceType: extra.priceType || 'NEGOTIABLE',
        wilaya,
        zone,
        age: extra.age || 'صغير',
        gender: extra.gender || 'ذكر',
        healthStatus: extra.healthStatus || 'ممتازة',
        phone: extra.phone || '55123456',
        contactMethod: 'WHATSAPP',
        deliveryAvailable: extra.deliveryAvailable ?? true,
        vetCertificate: extra.vetCertificate ?? false,
        featured: extra.featured ?? false,
        trustedSeller: extra.trustedSeller ?? true,
        sellerName: extra.sellerName || '',
        status: 'ACTIVE',
        userId: 0,
        createdAt: extra.createdAt || now.toISOString(),
        images: [realImage],
        imageUrls: [realImage],
        mainImageUrl: realImage,
      };
    };

    return [
      item(101, 'خروف عربي للتربية', 'أغنام', 1350, 'صفاقس', 'عقارب',
        { featured: true, age: '8 أشهر', description: 'خروف صحة باهية، مناسب للتربية والتسمين.' }),
      item(102, 'قطيع نعاج للبيع بالجملة', 'أغنام', 950, 'سيدي بوزيد', 'المكناسي',
        { priceType: 'PER_HEAD', sellerName: 'رحبة وردة', description: 'بيع بالجملة: قطيع 18 راس نعاج بصحة ممتازة. [bulk]', deliveryAvailable: false }),
      item(103, 'عجلة حلوب صغيرة', 'أبقار', 4800, 'باجة', 'تستور',
        { featured: true, vetCertificate: true, age: 'سنة ونصف', gender: 'أنثى', description: 'عجلة حلوب من سلالة منتجة مع متابعة صحية.' }),
      item(104, 'ثور تسمين قوي', 'أبقار', 6200, 'جندوبة', 'طبرقة',
        { age: 'سنتين', description: 'ثور للتسمين، وزن باهي وقابل للمعاينة.' }),
      item(105, 'ماعز شامية حلوبة', 'ماعز', 980, 'نابل', 'قرمبالية',
        { gender: 'أنثى', vetCertificate: true, description: 'ماعز حلوبة، هادئة ومناسبة لمزرعة صغيرة.' }),
      item(106, 'جدي صغير للتربية', 'ماعز', 420, 'القيروان', 'حفوز',
        { age: '4 أشهر', description: 'جدي صغير صحة ممتازة وسلالة محلية مقاومة.' }),
      item(107, 'دجاج بلدي بيّاض', 'دواجن', 28, 'أريانة', 'سكرة',
        { priceType: 'PER_HEAD', sellerName: 'فرمة البركة', gender: 'أنثى', description: 'بيع بالجملة: دجاج بلدي بيّاض، متوفر عدد محترم. [bulk]' }),
      item(108, 'كتاكيت عمر أسبوع', 'دواجن', 3.5, 'بن عروس', 'مرناق',
        { priceType: 'PER_HEAD', age: 'أسبوع', description: 'كتاكيت نشيطة، تصلح للتربية المنزلية.' }),
      item(109, 'فرس عربية للتدريب', 'خيول', 7600, 'القصرين', 'سبيطلة',
        { featured: true, gender: 'أنثى', age: '4 سنوات', vetCertificate: true, description: 'فرس عربية هادئة ومروّضة، مناسبة للهواية والتدريب.' }),
      item(110, 'مهر صغير بصحة ممتازة', 'خيول', 3200, 'منوبة', 'طبربة',
        { age: '10 أشهر', description: 'مهر صغير من أم عربية، قابل للمعاينة.' }),
      item(111, 'ناقة حلوب', 'جمال', 6500, 'تطاوين', 'رمادة',
        { gender: 'أنثى', age: '5 سنوات', featured: true, description: 'ناقة حلوب متعودة على الرعي، صحة ممتازة.' }),
      item(112, 'جمل صغير للتربية', 'جمال', 3900, 'مدنين', 'بن قردان',
        { age: 'سنة', description: 'جمل صغير قوي ومناسب للتربية.' }),
      item(113, 'أرانب بلدية منتجة', 'أرانب', 35, 'المنستير', 'جمال',
        { priceType: 'PER_HEAD', gender: 'أنثى', description: 'أرانب منتجة، متوفر ذكور وإناث حسب الطلب.' }),
      item(114, 'صغار أرانب للتربية', 'أرانب', 20, 'سوسة', 'مساكن',
        { priceType: 'PER_HEAD', age: 'شهر', trustedSeller: false, description: 'صغار أرانب بصحة جيدة، مناسبة للمبتدئين.' }),
      item(115, 'قطيع ماعز حلوبة بالجملة', 'ماعز', 900, 'نابل', 'قرمبالية',
        { priceType: 'PER_HEAD', sellerName: 'فرمة النور', gender: 'أنثى', description: 'بيع بالجملة: قطيع ماعز حلوبة وجديان للتربية. [bulk]' }),
      item(116, 'عجول تسمين بالجملة', 'أبقار', 4300, 'الكاف', 'تاجروين',
        { priceType: 'PER_HEAD', sellerName: 'سوق الكاف', age: 'سنة', description: 'بيع بالجملة: عجول تسمين متقاربة في الوزن. [bulk]' }),
      item(117, 'كتاكيت بالجملة للمربين', 'دواجن', 2.8, 'صفاقس', 'طينة',
        { priceType: 'PER_HEAD', sellerName: 'دجاج صفاقس', age: 'أسبوع', description: 'بيع بالجملة: كتاكيت نشيطة للمربين. [bulk]' }),
      item(118, 'أرانب منتجة بالجملة', 'أرانب', 32, 'المنستير', 'جمال',
        { priceType: 'PER_HEAD', sellerName: 'أرانب الساحل', gender: 'أنثى', description: 'بيع بالجملة: أرانب منتجة، ذكور وإناث حسب الطلب. [bulk]' }),
    ];
  }
}
