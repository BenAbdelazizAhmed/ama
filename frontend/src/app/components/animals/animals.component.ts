import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnInit,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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

  private readonly API = 'http://localhost:8081/api/animals';

  animals: AnimalResponse[] = [];
  filteredList: AnimalResponse[] = [];
  pagedList: AnimalResponse[] = [];

  isLoading = false;
  loadError = '';

  currentPage = 1;
  readonly PAGE_SIZE = 8;
  totalPages = 1;

  activeCategory = 'الكل';
  saleFilter: 'all' | 'single' | 'bulk' = 'all';
  addListingMode: 'single' | 'bulk' = 'single';
  sortValue = 'newest';
  searchQuery = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  bulkHeads: number | null = null;

  favIds = new Set<number>();
  showAddModal = false;

  addForm = this.freshForm();
  addErrors: Record<string, boolean> = {};
  addSubmitting = false;
  imgPreviews: string[] = [];
  imgFiles: File[] = [];

  toast: ToastMsg | null = null;
  private toastTimer: any;
  private filterTimer: any;

  readonly CATEGORIES = [
    'الكل', 'أغنام', 'أبقار', 'ماعز', 'دواجن', 'خيول', 'جمال', 'أرانب',
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
    private router: Router,
    private zone: NgZone,
  ) {}

  ngOnInit() {
    this.loadFavs();
    this.loadAnimals();
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  ngOnDestroy() {
    clearTimeout(this.filterTimer);
    clearTimeout(this.toastTimer);
  }

  loadAnimals() {
    this.isLoading = true;
    this.loadError = '';

    this.http.get<AnimalResponse[]>(this.API).subscribe({
      next: (data) => {
        this.zone.run(() => {
          const realAnimals = (data ?? []).map(a => this.normalise(a));
          const mockAnimals = this.getMockAnimals().filter(mock => !realAnimals.some(real => real.id === mock.id));
          this.animals = [...realAnimals, ...mockAnimals];
          this.isLoading = false;
          this.applyFilter();
          setTimeout(() => this.refreshIcons());
        });
      },
      error: (err) => {
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

    return { ...a, images: imageUrls, imageUrls, mainImageUrl: imageUrls[0] ?? '' };
  }

  applyFilter() {
    this.currentPage = 1;
    let list = [...this.animals];

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
    this.applyFilter();
  }

  filterSaleAll() { this.filterBySale('all'); }
  filterSaleSingle() { this.filterBySale('single'); }
  filterSaleBulk() { this.filterBySale('bulk'); }

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
    this.showAddModal = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.refreshIcons());
  }

  openSingleAddModal() { this.openAddModal('single'); }
  openBulkAddModal() { this.openAddModal('bulk'); }

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

  closeAddModal() {
    this.showAddModal = false;
    document.body.style.overflow = '';
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

  submitAdd() {
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

  private getMockAnimals(): AnimalResponse[] {
    const now = new Date();
    const item = (
      id: number,
      title: string,
      category: string,
      price: number,
      wilaya: string,
      zone: string,
      image: string,
      extra: Partial<AnimalResponse> = {},
    ): AnimalResponse => ({
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
      status: 'ACTIVE',
      userId: 0,
      createdAt: extra.createdAt || now.toISOString(),
      images: [image],
      imageUrls: [image],
      mainImageUrl: image,
    });

    return [
      item(101, 'خروف عربي للتربية', 'أغنام', 780, 'صفاقس', 'عقارب',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Awassi%20sheep.jpg',
        { featured: true, age: '8 أشهر', description: 'خروف صحة باهية، مناسب للتربية والتسمين.' }),
      item(102, 'قطيع نعاج للبيع بالجملة', 'أغنام', 620, 'سيدي بوزيد', 'المكناسي',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Flock%20of%20sheep.jpg',
        { priceType: 'PER_HEAD', description: 'بيع بالجملة: قطيع 18 راس نعاج بصحة ممتازة. [bulk]', deliveryAvailable: false }),
      item(103, 'عجلة حلوب صغيرة', 'أبقار', 2850, 'باجة', 'تستور',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Holstein%20cow.jpg',
        { featured: true, vetCertificate: true, age: 'سنة ونصف', gender: 'أنثى', description: 'عجلة حلوب من سلالة منتجة مع متابعة صحية.' }),
      item(104, 'ثور تسمين قوي', 'أبقار', 4200, 'جندوبة', 'طبرقة',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Brown%20bull.jpg',
        { age: 'سنتين', description: 'ثور للتسمين، وزن باهي وقابل للمعاينة.' }),
      item(105, 'ماعز شامية حلوبة', 'ماعز', 950, 'نابل', 'قرمبالية',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Damascus%20goat.jpg',
        { gender: 'أنثى', vetCertificate: true, description: 'ماعز حلوبة، هادئة ومناسبة لمزرعة صغيرة.' }),
      item(106, 'جدي صغير للتربية', 'ماعز', 360, 'القيروان', 'حفوز',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Goat%20kid.jpg',
        { age: '4 أشهر', description: 'جدي صغير صحة ممتازة وسلالة محلية مقاومة.' }),
      item(107, 'دجاج بلدي بيّاض', 'دواجن', 18, 'أريانة', 'سكرة',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Free%20range%20chickens.jpg',
        { priceType: 'PER_HEAD', gender: 'أنثى', description: 'دجاج بلدي بيّاض، متوفر عدد محترم.' }),
      item(108, 'كتاكيت عمر أسبوع', 'دواجن', 3, 'بن عروس', 'مرناق',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Chicks.jpg',
        { priceType: 'PER_HEAD', age: 'أسبوع', description: 'كتاكيت نشيطة، تصلح للتربية المنزلية.' }),
      item(109, 'فرس عربية للتدريب', 'خيول', 6800, 'القصرين', 'سبيطلة',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Arabian%20horse.jpg',
        { featured: true, gender: 'أنثى', age: '4 سنوات', vetCertificate: true, description: 'فرس عربية هادئة ومروّضة، مناسبة للهواية والتدريب.' }),
      item(110, 'مهر صغير بصحة ممتازة', 'خيول', 2400, 'منوبة', 'طبربة',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Foal.jpg',
        { age: '10 أشهر', description: 'مهر صغير من أم عربية، قابل للمعاينة.' }),
      item(111, 'ناقة حلوب', 'جمال', 5200, 'تطاوين', 'رمادة',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Dromedary%20camel.jpg',
        { gender: 'أنثى', age: '5 سنوات', featured: true, description: 'ناقة حلوب متعودة على الرعي، صحة ممتازة.' }),
      item(112, 'جمل صغير للتربية', 'جمال', 3100, 'مدنين', 'بن قردان',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Young%20camel.jpg',
        { age: 'سنة', description: 'جمل صغير قوي ومناسب للتربية.' }),
      item(113, 'أرانب بلدية منتجة', 'أرانب', 28, 'المنستير', 'جمال',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Domestic%20rabbit.jpg',
        { priceType: 'PER_HEAD', gender: 'أنثى', description: 'أرانب منتجة، متوفر ذكور وإناث حسب الطلب.' }),
      item(114, 'صغار أرانب للتربية', 'أرانب', 15, 'سوسة', 'مساكن',
        'https://commons.wikimedia.org/wiki/Special:FilePath/Baby%20rabbits.jpg',
        { priceType: 'PER_HEAD', age: 'شهر', trustedSeller: false, description: 'صغار أرانب بصحة جيدة، مناسبة للمبتدئين.' }),
    ];
  }
}
