import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   INTERFACES
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export interface Worker {
  id: string;
  name: string;
  title: string;
  location: string;
  experience: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  responseTime: string;
  price: number;
  priceUnit: string;
  available: boolean;
  skills: string;
  avatarUrl?: string;
  coverUrl?: string;
  description?: string;
  phone?: string;
}

export interface Job {
  id: string;
  title: string;
  employer: string;
  location: string;
  badge: string;
  badgeText: string;
  logo: string;
  description: string;
  jobType: string;
  tags: string;
  salary: string;
  period: string;
  deadline: string;
}

export interface UnifiedForm {
  formType: 'worker' | 'profile' | 'job';
  fullName: string;
  region: string;
  serviceType: string;
  phone: string;
  price: number | null;
  priceUnit: string;
  description: string;
  availability: string;
  avatarPreview: string;
  coverPreview: string;
  experience: string;
  skills: string;
  employer: string;
  jobType: string;
  deadline: string;
}

/** The unified "pro" modal form â€” covers all 4 form types */
export interface ProForm {
  // shared
  fullName: string;
  region: string;
  serviceType: string;
  phone: string;
  description: string;
  skills: string;
  availability: string;
  plan: string;
  avatarPreview: string;
  coverPreview: string;
  // worker / profile
  experience: string;
  price: number | null;
  priceUnit: string;
  // job / request
  jobTitle: string;
  employer: string;
  jobType: string;
  salary: number | null;
  deadline: string;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   MOCK DATA
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const MOCK_WORKERS: Worker[] = [
  {
    id: 'm1', name: 'علي بن سالم', title: 'راعي أغنام', location: 'صفاقس',
    experience: '5 سنوات', rating: 4.9, reviewCount: 47, completedJobs: 120,
    responseTime: 'فوراً', price: 80, priceUnit: 'دت/يوم', available: true,
    skills: 'رعي الأغنام,تربية الخرفان,الرعاية الصحية',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    description: 'خبرة 5 سنوات في رعي الأغنام والماعز. متاح للعمل اليومي والموسمي.',
    phone: '21655000001'
  },
  {
    id: 'm2', name: 'محمد الكريمي', title: 'طبيب بيطري', location: 'تونس العاصمة',
    experience: '8 سنوات', rating: 4.8, reviewCount: 89, completedJobs: 340,
    responseTime: 'أقل من ساعة', price: 150, priceUnit: 'دت/زيارة', available: true,
    skills: 'بيطرة,علاج الحيوانات,تلقيح',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80',
    description: 'طبيب بيطري متخصص في علاج الماشية والدواجن.',
    phone: '21622000002'
  },
  {
    id: 'm3', name: 'سامي الطرابلسي', title: 'سائق نقل حيوانات', location: 'سوسة',
    experience: '3 سنوات', rating: 4.7, reviewCount: 31, completedJobs: 85,
    responseTime: 'ساعتين', price: 200, priceUnit: 'دت/رحلة', available: false,
    skills: 'نقل حيوانات,سياقة شاحنة,خبرة طرق',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1537745885830-75e5a11e90f4?auto=format&fit=crop&w=1200&q=80',
    description: 'متخصص في نقل الأغنام والأبقار بين الولايات.',
    phone: '21699000003'
  },
  {
    id: 'm4', name: 'فاطمة الزريبي', title: 'مربية دواجن', location: 'قابس',
    experience: '6 سنوات', rating: 5.0, reviewCount: 22, completedJobs: 60,
    responseTime: 'فوراً', price: 90, priceUnit: 'دت/يوم', available: true,
    skills: 'تربية الدجاج,إنتاج البيض,إدارة مزرعة',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1200&q=80',
    description: 'خبرة في تربية الدواجن وإدارة مزارع البيض.',
    phone: '21644000004'
  },
  {
    id: 'm5', name: 'حمودة بن علي', title: 'عامل حقول', location: 'باجة',
    experience: '10 سنوات', rating: 4.6, reviewCount: 54, completedJobs: 200,
    responseTime: 'يرد لاحقاً', price: 60, priceUnit: 'دت/يوم', available: true,
    skills: 'حرث,زراعة,حصاد,ري',
    avatarUrl: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=200&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1200&q=80',
    description: 'خبرة طويلة في الزراعة ومراحل الإنتاج الفلاحي.',
    phone: '21677000005'
  },
  {
    id: 'm6', name: 'يوسف المحمودي', title: 'مربي نحل', location: 'نابل',
    experience: '4 سنوات', rating: 4.9, reviewCount: 18, completedJobs: 45,
    responseTime: 'فوراً', price: 100, priceUnit: 'دت/يوم', available: true,
    skills: 'تربية النحل,إنتاج العسل,صيانة الخلايا',
    avatarUrl: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?auto=format&fit=crop&w=200&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80',
    description: 'متخصص في تربية النحل وإنتاج العسل الطبيعي.',
    phone: '21688000006'
  }
];

const MOCK_JOBS: Job[] = [
  {
    id: 'j1', title: 'راعي أغنام لمزرعة كبيرة', employer: 'مزرعة سيدي عبيد',
    location: 'سيدي بوزيد', badge: 'urgent', badgeText: 'عاجل', logo: 'مزرعة',
    description: 'نبحث عن راعي خبرة لرعاية 200 رأس غنم في مزرعة كبيرة.',
    jobType: 'دوام كامل', tags: 'خبرة 3 سنوات,يقيم بالمزرعة',
    salary: '1200', period: 'دت/شهر', deadline: '2026-06-01'
  },
  {
    id: 'j2', title: 'طبيب بيطري متنقل', employer: 'شركة أغري تونس',
    location: 'صفاقس', badge: 'featured', badgeText: 'مميز', logo: 'شركة',
    description: 'فرصة عمل لطبيب بيطري متنقل لزيارة المزارع.',
    jobType: 'دوام جزئي', tags: 'جدول مرن,مكافآت',
    salary: '2500', period: 'دت/شهر', deadline: '2026-05-31'
  },
  {
    id: 'j3', title: 'عمال حصاد موسمي', employer: 'تعاونية باجة',
    location: 'باجة', badge: 'new', badgeText: 'جديد', logo: 'تعاونية',
    description: 'نبحث عن عمال للحصاد الموسمي لمدة شهرين.',
    jobType: 'موسمي', tags: 'مأكل وسكن,شهرين',
    salary: '900', period: 'دت/شهر', deadline: '2026-06-15'
  }
];

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   COMPONENT
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
})
export class ServicesComponent implements OnInit, OnDestroy {
  

  private readonly API = `${environment.apiBaseUrl}/api`;

  /* â”€â”€ Mode â”€â”€ */
  currentMode: 'hire' | 'work' = 'hire';

  /* â”€â”€ Data â”€â”€ */
  workers: Worker[] = [];
  jobs: Job[] = [];
  filteredWorkers: Worker[] = [];
  filteredJobs: Job[] = [];
  savedIds: Set<string> = new Set();

  /* â”€â”€ State â”€â”€ */
  isLoading = true;
  isFading = false;
  loadError = '';

  /* â”€â”€ Search â”€â”€ */
  searchQuery = '';
  selectedRegion = '';
  searchPlaceholder = 'مثال: راعي أغنام، بيطري، سائق...';
  searchTags: string[] = ['راعي أغنام', 'طبيب بيطري', 'سائق', 'فلاح', 'مشرف مزرعة'];

  /* â”€â”€ Filters â”€â”€ */
  currentFilter = 'all';
  selectedCategory = 'all';
  sortValue = 'best';
  viewMode: 'grid' | 'list' = 'grid';
  priceMax = 200;
  selectedRating = '0';
  selectedRegions: string[] = [];
  filteredCount = 0;
  resultsSub = 'عمال وخدمات تنجم تقارن بينهم';

  /* â”€â”€ Hero text â”€â”€ */
  heroTitle = 'لقى العامل المناسب لمزرعتك';
  heroSub = 'لوّج على عامل فلاحي، قارن السعر والتقييم وتواصل مباشرة.';
  trustTitle = 'تبحث على عامل؟';
  trustSub = 'انشر طلبك أو تواصل مع بروفايل مناسب';

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     PRO MODAL (new unified modal)
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  proModalOpen = false;
  proMode: 'hire' | 'work' = 'hire';
  /** which sub-form is active inside the modal */
  proFormType: 'job' | 'request' | 'worker' | 'profile' = 'job';
  proStep: 1 | 2 | 3 = 1;
  proSuccess = false;
  isSubmittingPro = false;

  proForm: ProForm = this.blankProForm();

  get proModalTitle(): string {
    const map: Record<string, string> = {
      job: 'انشر <em>وظيفة</em> فلاحية',
      request: 'انشر <em>طلب خدمة</em>',
      worker: 'أضف <em>بروفايل</em> عامل',
      profile: 'أضف <em>خدمة</em> مستقلة',
    };
    return map[this.proFormType] ?? '';
  }

  get proModalSub(): string {
    const map: Record<string, string> = {
      job: 'أوصل لمئات الكفاءات الفلاحية في ولايتك',
      request: 'صف شنية تحتاج وخلي العمال يتواصلوا معاك',
      worker: 'اعرض خبرتك وتواصل مع أصحاب العمل بثقة',
      profile: 'سوّق خدماتك المستقلة واربح أكثر',
    };
    return map[this.proFormType] ?? '';
  }

  /* â”€â”€ Add Modal (action bar) â”€â”€ */
  showAddModal = false;
  addModalStep: 1 | 2 = 1;
  isSubmittingAdd = false;
  addSuccess = false;
  unifiedForm: UnifiedForm = this.blankUnifiedForm();

  /* â”€â”€ Profile Details Modal â”€â”€ */
  profileDetailsOpen = false;
  selectedWorker: Worker | null = null;

  /* â”€â”€ Filter Drawer â”€â”€ */
  filterDrawerOpen = false;
  drawerFilter = 'all';
  drawerSort = 'best';

  /* â”€â”€ Toast â”€â”€ */
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;

  /* â”€â”€ Pagination â”€â”€ */
  currentPage = 1;
  pageNumbers = [1, 2, 3, 4, 5];

  /* Static data */
  filterChipsHire = [
    { value: 'all', label: 'الكل' },
    { value: 'راعي أغنام', label: 'رعاة' },
    { value: 'مربو الأبقار', label: 'أبقار' },
    { value: 'بيطري', label: 'بيطري' },
    { value: 'سائق', label: 'سائقون' },
    { value: 'دواجن', label: 'دواجن' },
    { value: 'فلاح', label: 'فلاحة' },
    { value: 'top', label: 'الأعلى تقييماً' },
    { value: 'available', label: 'متاح الآن' },
  ];

  filterChipsWork = [
    { value: 'all', label: 'الكل' },
    { value: 'urgent', label: 'عاجل' },
    { value: 'featured', label: 'مميز' },
    { value: 'new', label: 'جديد' },
    { value: 'دوام كامل', label: 'دوام كامل' },
    { value: 'موسمي', label: 'موسمي' },
  ];

  categories = [
    { value: 'all', icon: '', name: 'الكل', count: '3.2K' },
    { value: 'راعي أغنام', icon: '', name: 'رعاة الأغنام', count: '842' },
    { value: 'مربو الأبقار', icon: '', name: 'مربو الأبقار', count: '615' },
    { value: 'بيطري', icon: '', name: 'بيطريون', count: '384' },
    { value: 'سائق', icon: '', name: 'نقل الحيوانات', count: '297' },
    { value: 'دواجن', icon: '', name: 'مربو الدواجن', count: '441' },
    { value: 'فلاح', icon: '', name: 'عمال الحقول', count: '563' },
    { value: 'نحل', icon: '', name: 'مربو النحل', count: '178' },
  ];

  ratingOptions = [
    { value: '0', stars: 'الكل', label: 'كل التقييمات' },
    { value: '5', stars: '5', label: '5 نجوم' },
    { value: '4', stars: '4+', label: '4+ نجوم' },
    { value: '3', stars: '3+', label: '3+ نجوم' },
  ];

  regions = ['تونس', 'صفاقس', 'سوسة', 'قابس', 'نابل', 'سيدي بوزيد', 'الكاف', 'باجة'];

  serviceChips = [
    { value: 'راعي أغنام', label: 'راعي أغنام' },
    { value: 'أبقار', label: 'أبقار' },
    { value: 'بيطري', label: 'بيطري' },
    { value: 'نقل', label: 'نقل' },
    { value: 'فلاح', label: 'فلاح' },
    { value: 'دواجن', label: 'دواجن' },
  ];

  availOptions = ['فوراً', 'هذا الأسبوع', 'الشهر القادم', 'حسب الاتفاق'];

  postPlans = [
    { value: 'BASIC', icon: '', name: 'أساسي', price: 'مجاناً', feat: '7 أيام ظهور', best: false },
    { value: 'PRO', icon: '', name: 'محترف', price: '29 دت', feat: '30 يوم + ظهور مميز', best: true },
    { value: 'PREMIUM', icon: '', name: 'متميز', price: '59 دت', feat: '60 يوم أعلى النتائج', best: false },
  ];
  constructor(private http: HttpClient) {}

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     LIFECYCLE
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  ngOnInit(): void { this.loadAll(); }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    document.body.style.overflow = '';
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     DATA LOADING
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  loadAll(): void {
    this.loadError = '';
    this.workers = this.seedWorkers();
    this.jobs = this.seedJobs();
    this.isLoading = false;
    this.applyFilters();

    const workers$ = this.http.get<any[]>(`${this.API}/workers`).pipe(
      timeout(1200),
      map(list => list.map(w => this.mapWorker(w))),
      catchError(() => of([] as Worker[])),
    );

    const profiles$ = this.http.get<any[]>(`${this.API}/profiles`).pipe(
      timeout(1200),
      map(list => list.map(p => this.profileToWorker(p))),
      catchError(() => of([] as Worker[])),
    );

    const jobs$ = this.http.get<any[]>(`${this.API}/jobs`).pipe(
      timeout(1200),
      map(list => list.map(j => this.mapJob(j))),
      catchError(() => of([] as Job[])),
    );

    forkJoin([workers$, profiles$, jobs$]).subscribe({
      next: ([workers, profiles, jobs]) => {
        const cleanWorkers = [...workers, ...profiles].filter(w => this.isCleanWorker(w));
        const cleanJobs = jobs.filter(j => this.isCleanJob(j));
        if (cleanWorkers.length) this.workers = cleanWorkers;
        if (cleanJobs.length) this.jobs = cleanJobs;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.loadError = '';
      },
    });
  }

  /* â”€â”€ Mappers â”€â”€ */
  private mapWorker(w: any): Worker {
    return {
      id:            String(w.id ?? ''),
      name:          w.name          ?? '',
      title:         w.title         ?? '',
      location:      w.location      ?? '',
      experience:    w.experience    ?? 'جديد',
      rating:        Number(w.rating ?? 0),
      reviewCount:   Number(w.reviewCount  ?? 0),
      completedJobs: Number(w.completedJobs ?? 0),
      responseTime:  w.responseTime  ?? 'فوراً',
      price:         Number(w.price  ?? 0),
      priceUnit:     w.priceUnit     ?? 'دت/يوم',
      available:     w.available     !== false,
      skills:        w.skills        ?? '',
      avatarUrl:     w.avatarUrl     || undefined,
      coverUrl:      w.coverUrl      || undefined,
      description:   w.description   ?? '',
      phone:         w.phone         || undefined,
    };
  }

  private profileToWorker(p: any): Worker {
    return {
      id:            String(p.id ?? ''),
      name:          p.fullName      ?? '',
      title:         p.serviceType   ?? '',
      location:      p.region        ?? '',
      experience:    p.experience    ?? 'جديد',
      rating:        Number(p.rating ?? 0),
      reviewCount:   Number(p.reviewCount  ?? 0),
      completedJobs: Number(p.completedJobs ?? 0),
      responseTime:  p.availability  ?? 'فوراً',
      price:         Number(p.price  ?? 0),
      priceUnit:     p.period        ?? 'دت/يوم',
      available:     true,
      skills:        p.skills ?? p.serviceType ?? '',
      avatarUrl:     p.avatarUrl     || undefined,
      coverUrl:      p.coverUrl      || undefined,
      description:   p.experienceDescription ?? '',
      phone:         p.phone         || undefined,
    };
  }

  private mapJob(j: any): Job {
    return {
      id:          String(j.id ?? ''),
      title:       j.title       ?? '',
      employer:    j.employer    ?? '',
      location:    j.location    ?? '',
      badge:       j.badge       ?? 'new',
      badgeText:   j.badgeText   ?? 'جديد',
      logo:        j.logo        ?? 'AF',
      description: j.description ?? '',
      jobType:     j.jobType     ?? '',
      tags:        j.tags        ?? '',
      salary:      String(j.salary ?? '0'),
      period:      j.period      ?? 'دت/شهر',
      deadline:    j.deadline    ?? '',
    };
  }

  private seedWorkers(): Worker[] {
    return [
      {
        id: 'seed-w1', name: 'علي بن سالم', title: 'راعي أغنام', location: 'صفاقس',
        experience: '5 سنوات', rating: 4.9, reviewCount: 47, completedJobs: 120,
        responseTime: 'فوراً', price: 80, priceUnit: 'دت/يوم', available: true,
        skills: 'رعي الأغنام,تربية الخرفان,رعاية صحية',
        coverUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
        avatarUrl: 'https://ui-avatars.com/api/?name=Ali&background=0f7a3c&color=fff&size=200',
        description: 'خبرة قوية في رعي الأغنام والماعز. متاح للعمل اليومي والموسمي.',
        phone: '21655000001'
      },
      {
        id: 'seed-w2', name: 'محمد الكريمي', title: 'طبيب بيطري', location: 'تونس العاصمة',
        experience: '8 سنوات', rating: 4.8, reviewCount: 89, completedJobs: 340,
        responseTime: 'أقل من ساعة', price: 150, priceUnit: 'دت/زيارة', available: true,
        skills: 'بيطرة,علاج الحيوانات,تلقيح',
        coverUrl: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80',
        avatarUrl: 'https://ui-avatars.com/api/?name=Mohamed&background=0f7a3c&color=fff&size=200',
        description: 'طبيب بيطري متخصص في علاج الماشية والدواجن وزيارات المزارع.',
        phone: '21622000002'
      },
      {
        id: 'seed-w3', name: 'فاطمة الزريبي', title: 'مربية دواجن', location: 'قابس',
        experience: '6 سنوات', rating: 5, reviewCount: 22, completedJobs: 60,
        responseTime: 'فوراً', price: 90, priceUnit: 'دت/يوم', available: true,
        skills: 'تربية الدجاج,إنتاج البيض,إدارة مزرعة',
        coverUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1200&q=80',
        avatarUrl: 'https://ui-avatars.com/api/?name=Fatma&background=0f7a3c&color=fff&size=200',
        description: 'خبرة عملية في تربية الدواجن ومتابعة جودة الإنتاج.',
        phone: '21644000004'
      }
    ];
  }

  private seedJobs(): Job[] {
    return [
      {
        id: 'seed-j1', title: 'راعي أغنام لمزرعة كبيرة', employer: 'مزرعة سيدي عبيد',
        location: 'سيدي بوزيد', badge: 'urgent', badgeText: 'عاجل', logo: 'AF',
        description: 'نبحث عن راعي خبرة لرعاية 200 رأس غنم في مزرعة كبيرة.',
        jobType: 'دوام كامل', tags: 'خبرة 3 سنوات,إقامة بالمزرعة',
        salary: '1200', period: 'دت/شهر', deadline: '2026-06-01'
      },
      {
        id: 'seed-j2', title: 'طبيب بيطري متنقل', employer: 'شركة أغري-تونس',
        location: 'صفاقس', badge: 'featured', badgeText: 'مميز', logo: 'AF',
        description: 'فرصة عمل لطبيب بيطري متنقل لزيارة المزارع ومتابعة القطيع.',
        jobType: 'دوام جزئي', tags: 'جدول مرن,مكافآت',
        salary: '2500', period: 'دت/شهر', deadline: '2026-05-31'
      }
    ];
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     MODE SWITCH
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  setMode(mode: 'hire' | 'work'): void {
    this.currentMode   = mode;
    this.currentFilter = 'all';
    this.searchQuery   = '';

    if (mode === 'hire') {
      this.heroTitle         = 'لقى العامل المناسب لمزرعتك بسرعة';
      this.heroSub           = 'لوّج على راعي، بيطري، سائق أو عامل فلاحي، وشوف البروفايل والسعر والتواصل قبل ما تختار.';
      this.searchPlaceholder = 'مثال: راعي أغنام، بيطري، سائق...';
      this.resultsSub        = 'اختار عامل مناسب أو انشر طلبك باش يتواصلوا معاك';
      this.trustTitle        = 'تبحث على عامل؟';
      this.trustSub          = 'انشر طلبك أو تواصل مباشرة مع بروفايل مناسب';
      this.searchTags        = ['راعي أغنام', 'طبيب بيطري', 'سائق نقل', 'حلّاب أبقار', 'مربي دواجن'];
    } else {
      this.heroTitle         = 'سجّل بروفايلك وخلي الناس تلقاك';
      this.heroSub           = 'إذا إنت راعي، بيطري، سائق أو عامل فلاحي، سجّل خدمتك وشوف الوظائف المتاحة.';
      this.searchPlaceholder = 'مثال: راعي أغنام، بيطري، سائق...';
      this.resultsSub        = 'وظائف متاحة وبروفايلات عمال تنجم تقارن بينها';
      this.trustTitle        = 'تحب تخدم؟';
      this.trustSub          = 'سجّل بروفايل واضح باش أصحاب الخدمة يكلموك';
      this.searchTags        = ['راعي أغنام', 'طبيب بيطري', 'سائق شاحنة', 'فلاح', 'مشرف مزرعة'];
    }
    this.applyFilters();
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     SEARCH & FILTER
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  applySearch(): void {
    this.applyFilters();
    const el = document.getElementById('mainContent');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 20, behavior: 'smooth' });
  }

  quickSearch(tag: string): void { this.searchQuery = tag; this.applySearch(); }

  applyFilter(filter: string): void { this.currentFilter = filter; this.applyFilters(); }

  selectCategory(cat: string): void { this.selectedCategory = cat; this.currentFilter = cat; this.applyFilters(); }

  applySort(): void { this.applyFilters(); }

  applyFilters(): void {
    this.isFading = true;
    setTimeout(() => {
      this.currentMode === 'hire' ? this.filterWorkers() : this.filterJobs();
      this.isFading = false;
    }, 150);
  }

  private filterWorkers(): void {
    let list = [...this.workers];
    const q = this.searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter(w =>
        (w.name     ?? '').toLowerCase().includes(q) ||
        (w.title    ?? '').toLowerCase().includes(q) ||
        (w.location ?? '').toLowerCase().includes(q) ||
        (w.skills   ?? '').toLowerCase().includes(q)
      );
    }

    if (this.selectedRegion) {
      const r = this.selectedRegion.replace(' العاصمة', '');
      list = list.filter(w => (w.location ?? '').includes(r));
    }

    if (this.selectedRegions.length) {
      list = list.filter(w => this.selectedRegions.some(r => (w.location ?? '').includes(r)));
    }

    list = list.filter(w => (w.price ?? 0) <= this.priceMax);
    list = list.filter(w => (w.rating ?? 0) >= Number(this.selectedRating || 0));

    const f = this.currentFilter;
    if      (f === 'available') list = list.filter(w => w.available);
    else if (f === 'top')       list = list.filter(w => (w.completedJobs ?? 0) >= 60);
    else if (f !== 'all')       list = list.filter(w =>
      (w.skills ?? '').toLowerCase().includes(f.toLowerCase()) ||
      (w.title  ?? '').toLowerCase().includes(f.toLowerCase())
    );

    if      (this.sortValue === 'top-rated') list.sort((a, b) => b.rating - a.rating);
    else if (this.sortValue === 'price-asc') list.sort((a, b) => a.price  - b.price);
    else if (this.sortValue === 'newest')    list.reverse();

    this.filteredWorkers = list;
    this.filteredCount   = list.length;
  }

  private isCleanWorker(w: Worker): boolean {
    const text = [w.name, w.title, w.location, w.experience, w.priceUnit, w.skills].join(' ');
    return !!w.name?.trim() && !text.includes('????') && !text.includes('Ø') && !text.includes('Ù');
  }

  private isCleanJob(j: Job): boolean {
    const text = [j.title, j.employer, j.location, j.description, j.jobType, j.period].join(' ');
    return !!j.title?.trim() && !text.includes('????') && !text.includes('Ø') && !text.includes('Ù');
  }

  private filterJobs(): void {
    let list = [...this.jobs];
    const q = this.searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter(j =>
        (j.title       ?? '').toLowerCase().includes(q) ||
        (j.employer    ?? '').toLowerCase().includes(q) ||
        (j.description ?? '').toLowerCase().includes(q)
      );
    }

    if (this.selectedRegion) {
      const r = this.selectedRegion.replace(' العاصمة', '');
      list = list.filter(j => (j.location ?? '').includes(r));
    }

    if (this.selectedRegions.length) {
      list = list.filter(j => this.selectedRegions.some(r => (j.location ?? '').includes(r)));
    }

    const f = this.currentFilter;
    if (f !== 'all') {
      list = list.filter(j =>
        (j.badge   ?? '') === f ||
        (j.jobType ?? '').includes(f)
      );
    }

    this.filteredJobs  = list;
    this.filteredCount = list.length;
  }

  resetFilters(e: Event): void {
    e.preventDefault();
    this.searchQuery = ''; this.selectedRegion = '';
    this.currentFilter = 'all'; this.selectedCategory = 'all'; this.sortValue = 'best';
    this.applyFilters();
  }

  toggleRegion(reg: string): void {
    const i = this.selectedRegions.indexOf(reg);
    i >= 0 ? this.selectedRegions.splice(i, 1) : this.selectedRegions.push(reg);
    this.applyFilters();
  }

  setView(v: 'grid' | 'list'): void { this.viewMode = v; }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     PRO MODAL
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  openProModal(mode: 'hire' | 'work'): void {
    this.proMode     = mode;
    this.proFormType = mode === 'hire' ? 'request' : 'worker';
    this.proStep     = 1;
    this.proSuccess  = false;
    this.proForm     = this.blankProForm();

    // Adjust plans pricing per mode
    this.postPlans = [
      { value: 'BASIC',   icon: '', name: 'أساسي', price: 'مجاناً', feat: '7 أيام ظهور', best: false },
      { value: 'PRO',     icon: '', name: 'محترف', price: mode === 'work' ? '19 دت' : '29 دت', feat: '30 يوم + ظهور مميز', best: true  },
      { value: 'PREMIUM', icon: '', name: 'متميز', price: mode === 'work' ? '39 دت' : '59 دت', feat: '60 يوم أعلى النتائج', best: false },
    ];

    this.proModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  openJobModal(): void {
    this.proMode     = 'hire';
    this.proFormType = 'job';
    this.proStep     = 1;
    this.proSuccess  = false;
    this.proForm     = this.blankProForm();
    this.proModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeProModal(): void {
    this.proModalOpen = false;
    this.proSuccess   = false;
    document.body.style.overflow = '';
  }

  onProOverlayClick(e: MouseEvent): void {
    if ((e.target as Element).classList.contains('pro-modal-overlay')) this.closeProModal();
  }

  setProFormType(type: 'job' | 'request' | 'worker' | 'profile'): void {
    this.proFormType = type;
    this.proStep     = 1;
    this.proForm     = this.blankProForm();
  }

  nextProStep(): void {
    if (this.proStep === 1 && !this.proFormStep1Valid()) {
      this.showToast('رجاءً عمّر الحقول المطلوبة', 'error');
      return;
    }
    this.proStep = (this.proStep + 1) as 1 | 2 | 3;
  }

  prevProStep(): void {
    if (this.proStep > 1) this.proStep = (this.proStep - 1) as 1 | 2 | 3;
  }

  private proFormStep1Valid(): boolean {
    if (this.proFormType === 'job') {
      return !!(this.proForm.jobTitle && this.proForm.employer && this.proForm.region && this.proForm.description);
    }
    if (this.proFormType === 'request') {
      return !!(this.proForm.fullName && this.proForm.region && this.proForm.serviceType && this.proForm.description);
    }
    // worker / profile
    return !!(this.proForm.fullName && this.proForm.phone && this.proForm.serviceType && this.proForm.region);
  }

  /* Photo upload for pro modal */
  onProCoverChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { this.proForm.coverPreview = ev.target?.result as string; };
    reader.readAsDataURL(file);
  }

  onProAvatarChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { this.proForm.avatarPreview = ev.target?.result as string; };
    reader.readAsDataURL(file);
  }

  submitProForm(): void {
    this.isSubmittingPro = true;

    const f = this.proForm;

    if (this.proFormType === 'job') {
      const payload = {
        title: f.jobTitle, employer: f.employer, location: f.region,
        jobType: f.jobType || 'دوام كامل', salary: String(f.salary ?? 0),
        period: f.priceUnit || 'دت/شهر', description: f.description,
        deadline: f.deadline, badge: 'new', badgeText: 'جديد',
        tags: f.skills || '', logo: 'AF'
      };
      this.http.post<any>(`${this.API}/jobs`, payload).pipe(catchError(() => of(null))).subscribe(saved => {
        if (!saved) { this.handleProSubmitError(); return; }
        const j = this.mapJob(saved);
        this.jobs = [j, ...this.jobs];
        this.applyFilters();
        this.isSubmittingPro = false;
        this.proSuccess      = true;
        this.showToast('تم نشر الوظيفة بنجاح');
      });

    } else if (this.proFormType === 'request') {
      const payload = {
        requestTitle: f.fullName, region: f.region, serviceType: f.serviceType,
        details: f.description, budget: f.salary ?? 0,
        period: f.priceUnit || 'دت/يوم', availability: f.availability
      };
      this.http.post<any>(`${this.API}/service-requests`, payload).pipe(catchError(() => of(null))).subscribe(saved => {
        if (!saved) { this.handleProSubmitError(); return; }
        this.isSubmittingPro = false;
        this.proSuccess      = true;
        this.showToast('تم نشر الطلب بنجاح');
      });

    } else if (this.proFormType === 'worker') {
      const payload = {
        name: f.fullName, title: f.serviceType, location: f.region,
        experience: f.experience || 'جديد', price: f.price ?? 0,
        priceUnit: f.priceUnit || 'دت/يوم', skills: f.skills || f.serviceType,
        description: f.description, phone: f.phone, available: true,
        rating: 0.0, reviewCount: 0, completedJobs: 0,
        responseTime: f.availability || 'فوراً',
        avatarUrl: f.avatarPreview || null, coverUrl: f.coverPreview || null
      };
      this.http.post<any>(`${this.API}/workers`, payload).pipe(catchError(() => of(null))).subscribe(saved => {
        if (!saved) { this.handleProSubmitError(); return; }
        const w = this.mapWorker(saved);
        this.workers = [w, ...this.workers];
        this.applyFilters();
        this.isSubmittingPro = false;
        this.proSuccess      = true;
        this.showToast('تمت إضافة العامل بنجاح');
      });

    } else {
      // profile
      const payload = {
        fullName: f.fullName, region: f.region, serviceType: f.serviceType,
        experienceDescription: f.description, price: f.price ?? 0,
        period: f.priceUnit || 'دت/يوم', availability: f.availability,
        plan: f.plan, phone: f.phone, skills: f.skills || f.serviceType,
        avatarUrl: f.avatarPreview || null, coverUrl: f.coverPreview || null
      };
      this.http.post<any>(`${this.API}/profiles`, payload).pipe(catchError(() => of(null))).subscribe(saved => {
        if (!saved) { this.handleProSubmitError(); return; }
        const w = this.profileToWorker(saved);
        this.workers = [w, ...this.workers];
        this.applyFilters();
        this.isSubmittingPro = false;
        this.proSuccess      = true;
        this.showToast('تم نشر البروفايل بنجاح');
      });
    }
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     ADD MODAL (action bar)
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  openAddModal(): void {
    this.unifiedForm  = this.blankUnifiedForm();
    this.unifiedForm.formType = this.currentMode === 'hire' ? 'worker' : 'profile';
    this.addModalStep = 1;
    this.addSuccess   = false;
    this.showAddModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.addSuccess   = false;
    document.body.style.overflow = '';
  }

  onAddOverlayClick(e: MouseEvent): void {
    if ((e.target as Element).classList.contains('add-modal-overlay')) this.closeAddModal();
  }

  nextAddStep(): void {
    if (!this.unifiedForm.fullName || !this.unifiedForm.serviceType || !this.unifiedForm.region) {
      this.showToast('رجاءً عمّر الحقول المطلوبة', 'error'); return;
    }
    this.addModalStep = 2;
  }

  triggerInput(id: string): void { document.getElementById(id)?.click(); }

  onCoverChange(e: Event, target: 'add' | 'post'): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (target === 'add') this.unifiedForm.coverPreview = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onAvatarChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { this.unifiedForm.avatarPreview = ev.target?.result as string; };
    reader.readAsDataURL(file);
  }

  submitAddForm(): void {
    if (!this.unifiedForm.fullName || !this.unifiedForm.serviceType || !this.unifiedForm.region || !this.unifiedForm.description) {
      this.showToast('رجاءً عمّر الحقول المطلوبة', 'error'); return;
    }
    this.isSubmittingAdd = true;
    const f = this.unifiedForm;

    if (f.formType === 'worker') {
      const payload = {
        name: f.fullName, title: f.serviceType, location: f.region,
        experience: f.experience || 'جديد', price: f.price ?? 0,
        priceUnit: f.priceUnit || 'دت/يوم', skills: f.skills || f.serviceType,
        description: f.description, phone: f.phone, available: true,
        rating: 0.0, reviewCount: 0, completedJobs: 0,
        responseTime: f.availability || 'فوراً',
        avatarUrl: f.avatarPreview || null, coverUrl: f.coverPreview || null
      };
      this.http.post<any>(`${this.API}/workers`, payload).pipe(catchError(() => of(null))).subscribe(saved => {
        if (!saved) { this.handleAddSubmitError(); return; }
        const w = this.mapWorker(saved);
        this.workers = [w, ...this.workers];
        this.applyFilters();
        this.isSubmittingAdd = false;
        this.addSuccess      = true;
        this.showToast('تمت إضافة العامل بنجاح');
      });

    } else if (f.formType === 'profile') {
      const payload = {
        fullName: f.fullName, region: f.region, serviceType: f.serviceType,
        experienceDescription: f.description, price: f.price ?? 0,
        period: f.priceUnit || 'دت/يوم', availability: f.availability || 'فوراً',
        plan: 'BASIC', phone: f.phone, skills: f.skills || f.serviceType,
        avatarUrl: f.avatarPreview || null, coverUrl: f.coverPreview || null
      };
      this.http.post<any>(`${this.API}/profiles`, payload).pipe(catchError(() => of(null))).subscribe(saved => {
        if (!saved) { this.handleAddSubmitError(); return; }
        const w = this.profileToWorker(saved);
        this.workers = [w, ...this.workers];
        this.applyFilters();
        this.isSubmittingAdd = false;
        this.addSuccess      = true;
        this.showToast('تم نشر البروفايل بنجاح');
      });

    } else {
      const payload = {
        title: f.serviceType, employer: f.employer || f.fullName, location: f.region,
        jobType: f.jobType || 'دوام كامل', salary: String(f.price ?? 0),
        period: f.priceUnit || 'دت/شهر', description: f.description,
        deadline: f.deadline, badge: 'new', badgeText: 'جديد',
        tags: f.skills || '', logo: 'AF'
      };
      this.http.post<any>(`${this.API}/jobs`, payload).pipe(catchError(() => of(null))).subscribe(saved => {
        if (!saved) { this.handleAddSubmitError(); return; }
        const j = this.mapJob(saved);
        this.jobs = [j, ...this.jobs];
        this.applyFilters();
        this.isSubmittingAdd = false;
        this.addSuccess      = true;
        this.showToast('تم نشر الإعلان بنجاح');
      });
    }
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     PROFILE DETAILS MODAL
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  private handleProSubmitError(): void {
    this.isSubmittingPro = false;
    this.proSuccess = false;
    this.showToast('تعذر الحفظ في الخادم. تأكد أن backend و MySQL يعملان.', 'error');
  }

  private handleAddSubmitError(): void {
    this.isSubmittingAdd = false;
    this.addSuccess = false;
    this.showToast('تعذر الحفظ في الخادم. تأكد أن backend و MySQL يعملان.', 'error');
  }

  openProfileDetails(index: number): void {
    const w = this.filteredWorkers[index];
    if (!w) return;
    this.selectedWorker     = w;
    this.profileDetailsOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeProfileDetails(): void {
    this.profileDetailsOpen = false;
    this.selectedWorker     = null;
    document.body.style.overflow = '';
  }

  onProfileDetailsOverlayClick(e: MouseEvent): void {
    if ((e.target as Element).classList.contains('profile-details-overlay')) this.closeProfileDetails();
  }

  requestService(w: Worker): void {
    const payload = {
      requestTitle: `طلب خدمة: ${w.title}`,
      region: w.location,
      serviceType: w.title,
      details: `طلب تواصل مع ${w.name} عبر AMANAFARM`,
      budget: w.price ?? 0,
      period: w.priceUnit || 'دت/يوم',
      availability: 'PENDING',
    };

    this.http.post<any>(`${this.API}/service-requests`, payload).pipe(catchError(() => of(null))).subscribe(saved => {
      if (!saved) {
        this.showToast('تعذر إرسال طلب الخدمة للخادم', 'error');
        return;
      }
      this.showToast('تم إرسال طلب الخدمة وحفظه في الخادم');
      this.closeProfileDetails();
    });
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     WHATSAPP
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  contactWhatsapp(name: string, phone?: string): void {
    const num = phone ?? '21600000000';
    const msg = encodeURIComponent(`مرحبا، نحب نتواصل مع ${name} عبر AMANAFARM`);
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank', 'noopener,noreferrer');
  }

  getWhatsappMessage(name: string): string {
    return encodeURIComponent(`مرحبا، نحب نتواصل مع ${name} عبر AMANAFARM`);
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     SAVE / FAVOURITES
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  toggleSave(id: string): void {
    if (this.savedIds.has(id)) {
      this.savedIds.delete(id);
      this.showToast('تم حذف البروفايل من المفضلة');
    } else {
      this.savedIds.add(id);
      this.showToast('تم حفظ البروفايل في المفضلة');
    }
    this.savedIds = new Set(this.savedIds);
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     FILTER DRAWER
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  openFilterDrawer(): void  { this.filterDrawerOpen = true;  document.body.style.overflow = 'hidden'; }
  closeFilterDrawer(): void { this.filterDrawerOpen = false; document.body.style.overflow = '';       }

  onDrawerOverlayClick(e: MouseEvent): void {
    if ((e.target as Element).classList.contains('filter-drawer-overlay')) this.closeFilterDrawer();
  }

  applyDrawerFilters(): void {
    this.currentFilter = this.drawerFilter;
    this.sortValue     = this.drawerSort;
    this.applyFilters();
    this.closeFilterDrawer();
  }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     PAGINATION
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  changePage(dir: number): void {
    const np = this.currentPage + dir;
    if (np >= 1 && np <= this.pageNumbers.length) this.currentPage = np;
  }
  goToPage(p: number): void { this.currentPage = p; }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     JOB ACTIONS
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  applyToJob(id: string): void { this.showToast('تم إرسال طلب التقديم'); }

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     HELPERS
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  getStars(rating: number): string {
    const r = Math.min(5, Math.max(0, Math.round(rating ?? 0)));
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  getSkillsArray(skills: string): string[] {
    if (!skills) return [];
    return skills.split(',').map(s => s.trim()).filter(Boolean);
  }

  getTagsArray(tags: string): string[] {
    if (!tags) return [];
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  getBadgeClass(badge: string): string {
    return ({ urgent: 'badge-urgent', featured: 'badge-featured', new: 'badge-new' } as any)[badge] ?? 'badge-new';
  }

  fmtPrice(p: number | null | undefined): string {
    return (p ?? 0).toLocaleString('fr-TN');
  }

  /* â”€â”€ Blank forms â”€â”€ */
  private blankProForm(): ProForm {
    return {
      fullName: '', region: '', serviceType: '', phone: '',
      description: '', skills: '', availability: 'حسب الاتفاق',
      plan: 'PRO', avatarPreview: '', coverPreview: '',
      experience: '1-3 سنوات', price: null, priceUnit: 'دت/يوم',
      jobTitle: '', employer: '', jobType: 'دوام كامل',
      salary: null, deadline: '',
    };
  }

  private blankUnifiedForm(): UnifiedForm {
    return {
      formType: 'worker', fullName: '', region: '', serviceType: '', phone: '',
      price: null, priceUnit: 'دت/يوم', description: '', availability: 'فوراً',
      avatarPreview: '', coverPreview: '', experience: '', skills: '',
      employer: '', jobType: 'دوام كامل', deadline: ''
    };
  }

  /* â”€â”€ Toast â”€â”€ */
  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = msg; this.toastType = type; this.toastVisible = true;
    this.toastTimer = setTimeout(() => { this.toastVisible = false; }, 2700);
  }
}

