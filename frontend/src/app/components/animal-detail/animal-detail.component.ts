import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StateService } from '../../services/state.service';

type PriceType = 'FIXED' | 'NEGOTIABLE' | 'PER_HEAD' | 'PER_KG' | string;

interface AnimalDetail {
  id: number;
  title: string;
  category: string;
  breed: string;
  gender: string;
  age: string;
  weight: string;
  price: number;
  priceType: PriceType;
  location: string;
  zone: string;
  healthStatus: string;
  status: string;
  description: string;
  phone: string;
  sellerName: string;
  sellerRating: number;
  sellerSince: string;
  responseTime: string;
  imageUrls: string[];
  trustedSeller: boolean;
  deliveryAvailable: boolean;
  vetCertificate: boolean;
  featured: boolean;
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
  selector: 'app-animal-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './animal-detail.component.html',
  styleUrls: ['./animal-detail.component.css'],
})
export class AnimalDetailComponent implements OnDestroy {
  private readonly api = `${environment.apiBaseUrl}/api/animals`;
  private readonly sub: Subscription;
  private readonly toastTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private toastCounter = 0;

  animal: AnimalDetail | null = null;
  similarAnimals: AnimalDetail[] = [];
  isLoading = true;
  errorMessage = '';
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
      this.loadAnimal(Number(params.get('id') || 0));
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
    return this.animal?.imageUrls?.length ? this.animal.imageUrls : [this.fallbackImage];
  }

  get detailToasts(): Toast[] {
    return this.toasts;
  }

  get fallbackImage(): string {
    return '/assets/hero-sheep.png';
  }

  get specs(): DetailSpec[] {
    const a = this.animal;
    if (!a) return [];

    return [
      { label: 'الولاية', value: this.clean(a.location) },
      { label: 'المنطقة', value: this.clean(a.zone) },
      { label: 'الصنف', value: this.clean(a.category) },
      { label: 'السلالة', value: this.clean(a.breed) },
      { label: 'الجنس', value: this.clean(a.gender) },
      { label: 'العمر', value: this.clean(a.age) },
      { label: 'الوزن', value: this.clean(a.weight) },
      { label: 'الصحة', value: this.clean(a.healthStatus) },
    ];
  }

  get isLoggedIn(): boolean {
    return this.state.isLoggedIn();
  }

  loadAnimal(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.animal = null;
    this.selectedImage = '';

    this.http.get<any>(`${this.api}/${id}`).pipe(timeout(2500)).subscribe({
      next: data => {
        const animal = this.mapApiAnimal(data, id);
        this.setAnimal(animal);
        this.loadSimilar(animal);
      },
      error: () => {
        const fallback = this.fallbackAnimals().find(item => item.id === id);
        if (!fallback) {
          this.isLoading = false;
          this.errorMessage = 'هذا الإعلان غير موجود أو تعذر تحميله.';
          return;
        }

        this.setAnimal(fallback);
        this.similarAnimals = this.fallbackAnimals()
          .filter(item => item.id !== fallback.id && item.category === fallback.category)
          .slice(0, 4);
      },
    });
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

  onImageError(): void {
    this.selectedImage = this.fallbackImage;
  }

  similarImage(item: AnimalDetail): string {
    return item.imageUrls[0] || this.fallbackImage;
  }

  goBack(): void {
    this.location.back();
  }

  contactSeller(): void {
    if (!this.state.isLoggedIn()) {
      this.requireLogin('contact-seller');
      return;
    }
    this.openWhatsapp();
  }

  openWhatsapp(): void {
    if (!this.animal) return;

    if (!this.state.isLoggedIn()) {
      this.requireLogin('contact-seller');
      return;
    }

    const phone = this.normalizePhone(this.animal.phone);
    if (!phone) {
      this.showToast('رقم الهاتف غير متوفر لهذا الإعلان.', 'error');
      return;
    }

    const message = encodeURIComponent(
      `مرحبا، شفت إعلان "${this.animal.title}" في AMANAFARM ونحب نسأل عليه.`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
  }

  openWa(): void {
    this.openWhatsapp();
  }

  requestInspection(): void {
    if (!this.state.isLoggedIn()) {
      this.requireLogin('contact-seller');
      return;
    }
    this.showToast('تم إرسال طلب معاينة للبائع.', 'success');
  }

  toggleFav(): void {
    if (!this.state.isLoggedIn()) {
      this.requireLogin('favorite');
      return;
    }

    this.isFav = !this.isFav;
    this.showToast(
      this.isFav ? 'تم حفظ الإعلان في المفضلة.' : 'تم حذف الإعلان من المفضلة.',
      'success'
    );
  }

  shareAnimal(): void {
    const url = window.location.href;
    if (navigator.share && this.animal) {
      navigator.share({ title: this.animal.title, url }).catch(() => undefined);
      return;
    }

    navigator.clipboard?.writeText(url);
    this.showToast('تم نسخ رابط الإعلان', 'success');
  }

  showToast(message: string, type: Toast['type'] = 'info'): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, message, type });

    const timer = setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.toastTimers.delete(id);
    }, 3500);

    this.toastTimers.set(id, timer);
  }

  fmt(value: number | string): string {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n.toLocaleString('fr-TN') : '-';
  }

  priceTypeLabel(type: PriceType): string {
    const map: Record<string, string> = {
      FIXED: 'سعر ثابت',
      NEGOTIABLE: 'قابل للتفاوض',
      PER_HEAD: 'للرأس',
      PER_KG: 'للكيلو',
    };
    return map[type] || 'قابل للتفاوض';
  }

  statusLabel(status: string): string {
    return String(status || '').toLowerCase() === 'sold' ? 'مباع' : 'متوفر';
  }

  isSoldStatus(status: string): boolean {
    return String(status || '').toLowerCase() === 'sold';
  }

  postedLabel(date: Date): string {
    const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
    if (days === 0) return 'اليوم';
    if (days === 1) return 'منذ يوم';
    if (days < 11) return `منذ ${days} أيام`;
    return `منذ ${days} يوما`;
  }

  trackById = (_: number, item: AnimalDetail): number => item.id;
  trackBySpec = (_: number, item: DetailSpec): string => item.label;
  trackByImage = (_: number, url: string): string => url;
  trackByPhoto = (_: number, url: string): string => url;
  trackByToast = (_: number, t: Toast): number => t.id;

  private setAnimal(animal: AnimalDetail): void {
    this.animal = animal;
    this.currentPhoto = 0;
    this.selectedImage = animal.imageUrls[0] || this.fallbackImage;
    this.isLoading = false;
  }

  private loadSimilar(animal: AnimalDetail): void {
    this.http.get<any[]>(this.api).pipe(timeout(1800)).subscribe({
      next: list => {
        const mapped = (list || []).map(item => this.mapApiAnimal(item, Number(item?.id || 0)));
        this.similarAnimals = mapped
          .filter(item => item.id !== animal.id && item.category === animal.category)
          .slice(0, 4);

        if (!this.similarAnimals.length) {
          this.similarAnimals = this.fallbackAnimals()
            .filter(item => item.id !== animal.id)
            .slice(0, 4);
        }
      },
      error: () => {
        this.similarAnimals = this.fallbackAnimals()
          .filter(item => item.id !== animal.id)
          .slice(0, 4);
      },
    });
  }

  private requireLogin(action: string): void {
    this.showToast('سجّل الدخول للتواصل مع البائع', 'info');
    window.dispatchEvent(new CustomEvent('amanafarm-login-required', { detail: { action } }));
  }

  private mapApiAnimal(raw: any, id: number): AnimalDetail {
    return {
      id: Number(raw?.id || id),
      title: this.clean(raw?.title || raw?.name || 'إعلان حيوان'),
      category: this.clean(raw?.category || 'حيوانات'),
      breed: this.clean(raw?.breed || raw?.race || 'غير محدد'),
      gender: this.clean(raw?.gender || 'غير محدد'),
      age: this.clean(raw?.age || 'غير محدد'),
      weight: this.clean(raw?.weight || 'غير محدد'),
      price: Number(raw?.price || 0),
      priceType: raw?.priceType || 'NEGOTIABLE',
      location: this.clean(raw?.wilaya || raw?.location || 'تونس'),
      zone: this.clean(raw?.zone || 'غير محدد'),
      healthStatus: this.clean(raw?.healthStatus || 'غير محدد'),
      status: this.clean(raw?.status || 'available'),
      description: this.clean(raw?.description || 'لا يوجد وصف مفصل لهذا الإعلان.'),
      phone: this.clean(raw?.phone || raw?.contactPhone || ''),
      sellerName: this.clean(raw?.sellerName || 'بائع موثوق'),
      sellerRating: Number(raw?.sellerRating || 4.8),
      sellerSince: this.clean(raw?.sellerSince || '2024'),
      responseTime: this.clean(raw?.responseTime || 'يرد عادة خلال ساعة'),
      imageUrls: this.extractImages(raw),
      trustedSeller: Boolean(raw?.trustedSeller ?? raw?.sellerVerified ?? true),
      deliveryAvailable: Boolean(raw?.deliveryAvailable),
      vetCertificate: Boolean(raw?.vetCertificate),
      featured: Boolean(raw?.featured),
      createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
    };
  }

  private extractImages(raw: any): string[] {
    const rawImages = Array.isArray(raw?.images) ? raw.images : [];
    const urls: string[] = rawImages
      .map((img: any) =>
        typeof img === 'string' ? img : (img?.imageUrl || img?.url || img?.src || '')
      )
      .filter(Boolean);

    if (raw?.mainImageUrl) urls.unshift(raw.mainImageUrl);
    if (raw?.imageUrl) urls.unshift(raw.imageUrl);

    return [...new Set(
      urls.map((url: string) => this.normalizeImageUrl(url)).filter(Boolean)
    )];
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

  private fallbackAnimals(): AnimalDetail[] {
    return [
      {
        id: 1,
        title: 'كبش بربري ممتاز للتربية',
        category: 'أغنام',
        breed: 'بربري تونسي',
        gender: 'ذكر',
        age: 'سنة',
        weight: '65 كغ',
        price: 1250,
        priceType: 'NEGOTIABLE',
        location: 'سيدي بوزيد',
        zone: 'المكناسي',
        healthStatus: 'ممتاز',
        status: 'available',
        description: 'كبش بربري بصحة ممتازة، تربية محلية نظيفة. مناسب للتربية وتحسين القطيع ويمكن معاينته قبل الشراء.',
        phone: '21655000001',
        sellerName: 'محمد الطرابلسي',
        sellerRating: 4.9,
        sellerSince: '2022',
        responseTime: 'يرد خلال ساعة',
        imageUrls: ['assets/prod-sheep.jpg', 'assets/hero-sheep.png', 'assets/za.png'],
        trustedSeller: true,
        deliveryAvailable: true,
        vetCertificate: false,
        featured: true,
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        id: 2,
        title: 'نعجة بربرية صغيرة',
        category: 'أغنام',
        breed: 'بربري تونسي',
        gender: 'أنثى',
        age: '8 أشهر',
        weight: '40 كغ',
        price: 780,
        priceType: 'FIXED',
        location: 'صفاقس',
        zone: 'جبنيانة',
        healthStatus: 'جيد',
        status: 'available',
        description: 'نعجة صغيرة بصحة جيدة، مناسبة للتربية ويمكن معاينتها في الضيعة.',
        phone: '21655000002',
        sellerName: 'علي بن عمر',
        sellerRating: 4.6,
        sellerSince: '2023',
        responseTime: 'يرد خلال يوم',
        imageUrls: ['assets/hero-sheep.png', 'assets/prod-sheep.jpg', 'assets/ba3.png'],
        trustedSeller: false,
        deliveryAvailable: false,
        vetCertificate: false,
        featured: false,
        createdAt: new Date(Date.now() - 7 * 86400000),
      },
      {
        id: 3,
        title: 'عجل للتسمين بصحة ممتازة',
        category: 'أبقار',
        breed: 'محلي',
        gender: 'ذكر',
        age: '5 أشهر',
        weight: '120 كغ',
        price: 2450,
        priceType: 'NEGOTIABLE',
        location: 'سيدي بوزيد',
        zone: 'الرقاب',
        healthStatus: 'ممتاز',
        status: 'available',
        description: 'عجل بصحة ممتازة جاهز للتسمين، تغذية نظيفة ويمكن التنسيق للمعاينة.',
        phone: '21655000003',
        sellerName: 'حسين المنصوري',
        sellerRating: 4.7,
        sellerSince: '2021',
        responseTime: 'يرد خلال ساعتين',
        imageUrls: ['assets/prod-cow.jpg', 'assets/bagra.png', 'assets/bagraa.jpg'],
        trustedSeller: true,
        deliveryAvailable: true,
        vetCertificate: true,
        featured: false,
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        id: 4,
        title: 'ماعز محلي قابل للمعاينة',
        category: 'ماعز',
        breed: 'محلي',
        gender: 'أنثى',
        age: 'سنة',
        weight: '35 كغ',
        price: 520,
        priceType: 'NEGOTIABLE',
        location: 'صفاقس',
        zone: 'ساقية الزيت',
        healthStatus: 'جيد',
        status: 'available',
        description: 'ماعز محلية بصحة جيدة، مناسبة للحليب والتربية المنزلية.',
        phone: '21655000004',
        sellerName: 'فاطمة بن حسن',
        sellerRating: 4.5,
        sellerSince: '2023',
        responseTime: 'يرد خلال 3 ساعات',
        imageUrls: ['assets/prod-goat.jpg', 'assets/ba3.png'],
        trustedSeller: false,
        deliveryAvailable: false,
        vetCertificate: false,
        featured: false,
        createdAt: new Date(Date.now() - 10 * 86400000),
      },
      {
        id: 5,
        title: 'دجاج بلدي بياض',
        category: 'دواجن',
        breed: 'بلدي تونسي',
        gender: 'أنثى',
        age: '6 أشهر',
        weight: 'غير محدد',
        price: 18,
        priceType: 'PER_HEAD',
        location: 'أريانة',
        zone: 'سكرة',
        healthStatus: 'ممتاز',
        status: 'available',
        description: 'دجاج بلدي بياض مناسب للتربية المنزلية، متوفر بعدد محترم وقابل للمعاينة.',
        phone: '21655000005',
        sellerName: 'فرمة البركة',
        sellerRating: 4.8,
        sellerSince: '2023',
        responseTime: 'يرد خلال ساعة',
        imageUrls: ['assets/prod-chicken.jpg', 'assets/djj.png', 'assets/coq.png'],
        trustedSeller: true,
        deliveryAvailable: true,
        vetCertificate: false,
        featured: true,
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        id: 6,
        title: 'ناقة حلوب من تطاوين',
        category: 'جمال',
        breed: 'محلي',
        gender: 'أنثى',
        age: '5 سنوات',
        weight: 'غير محدد',
        price: 5200,
        priceType: 'NEGOTIABLE',
        location: 'تطاوين',
        zone: 'رمادة',
        healthStatus: 'ممتاز',
        status: 'available',
        description: 'ناقة حلوب متعودة على الرعي، صحة ممتازة ومناسبة للتربية والإنتاج.',
        phone: '21655000006',
        sellerName: 'راعي الجنوب',
        sellerRating: 4.9,
        sellerSince: '2021',
        responseTime: 'يرد خلال ساعتين',
        imageUrls: ['https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=900&q=80'],
        trustedSeller: true,
        deliveryAvailable: false,
        vetCertificate: true,
        featured: true,
        createdAt: new Date(Date.now() - 6 * 86400000),
      },
    ];
  }
}
