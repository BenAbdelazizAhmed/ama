import { AfterViewInit, Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  StateService,
  AnimalAd,
  Worker,
  Product,
  WholesaleItem,
  ProfessionalProfile,
  ServiceRequest,
  JobOffer,
} from '../../services/state.service';
import { environment } from '../../../environments/environment';

declare const lucide: any;

interface SiteStats {
  publishedAds: number;
  siteVisits: number;
  registeredUsers: number;
}

interface Testimonial {
  stars: string;
  text: string;
  image: string;
  name: string;
  loc: string;
  result: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  animals: AnimalAd[] = [];
  workers: Worker[] = [];
  products: Product[] = [];
  wholesale: WholesaleItem[] = [];
  profiles: ProfessionalProfile[] = [];
  requests: ServiceRequest[] = [];
  jobs: JobOffer[] = [];
  currentTestimonial = 0;

  private siteStats: SiteStats = {
    publishedAds: 0,
    siteVisits: 0,
    registeredUsers: 0,
  };

  private readonly API_BASE = '';

  readonly testimonials: Testimonial[] = [
    {
      stars: '★★★★★',
      text: 'نشرت إعلاني في دقائق، الصور كانت واضحة والتواصل جا سريع على واتساب. التجربة حسستني أن المنصة جدية.',
      image: '/assets/ft.png',
      name: 'محمد الشريف',
      loc: 'سوسة',
      result: 'باع 3 خرفان خلال أسبوع',
    },
    {
      stars: '★★★★★',
      text: 'لقيت بقرة حلوب بسعر منطقي ومن ولاية قريبة. الفلاتر والاتصال المباشر خلاو عملية الشراء أوضح وأسهل.',
      image: '/assets/foucha.png',
      name: 'فاطمة بن سالم',
      loc: 'صفاقس',
      result: 'اشترت بقرة هولشتاين',
    },
    {
      stars: '★★★★★',
      text: 'الواجهة منظمة وتعطي ثقة. لقيت أعلاف وخدمات قريبة مني، والأهم أن تفاصيل البائع كانت واضحة.',
      image: '/assets/frm.png',
      name: 'الحاج رضا',
      loc: 'قابس',
      result: 'مستخدم منذ التأسيس',
    },
  ];

  constructor(public state: StateService, private router: Router) {
    effect(() => { this.animals = state.animals(); });
    effect(() => { this.workers = state.workers(); });
    effect(() => { this.products = state.products(); });
    effect(() => { this.wholesale = state.wholesale(); });
    effect(() => { this.profiles = state.profiles(); });
    effect(() => { this.requests = state.requests(); });
    effect(() => { this.jobs = state.jobs(); });
  }

  ngOnInit(): void {
    void this.loadSiteStats();
  }

  ngAfterViewInit(): void {
    this.refreshIcons();
    this.initRevealMotion();
    this.renderHomeStats();
  }

  get totalAnimals(): number { return this.animals.length; }
  get totalWorkers(): number { return this.workers.length; }
  get totalProfiles(): number { return this.profiles.length; }
  get totalProducts(): number { return this.products.length; }
  get totalListings(): number { return this.animals.length + this.products.length + this.wholesale.length; }

  goPost(): void {
    if (!this.state.user()) {
      window.dispatchEvent(new CustomEvent('amanafarm-login-required'));
      return;
    }
    void this.router.navigate(['/animals']);
  }

  browseAds(): void {
    void this.router.navigate(['/animals']);
  }

  publishProduct(): void {
    this.openPublishRoute('/products', 'product');
  }

  registerSupplier(): void {
    this.openPublishRoute('/products', 'product-company');
  }

  publishAnimal(): void {
    this.openPublishRoute('/animals', 'animal');
  }

  publishBulkAnimal(): void {
    this.openPublishRoute('/animals', 'animal-bulk');
  }

  browseProducts(): void {
    void this.router.navigate(['/products']);
  }

  browseAnimals(): void {
    void this.router.navigate(['/animals']);
  }

  private openPublishRoute(route: '/animals' | '/products', publish: string): void {
    void this.router.navigate([route], {
      queryParams: { publish, open: Date.now() },
    });
  }

  prevTesti(): void {
    this.currentTestimonial = this.currentTestimonial === 0 ? this.testimonials.length - 1 : this.currentTestimonial - 1;
    setTimeout(() => this.refreshIcons(), 0);
  }

  nextTesti(): void {
    this.currentTestimonial = this.currentTestimonial === this.testimonials.length - 1 ? 0 : this.currentTestimonial + 1;
    setTimeout(() => this.refreshIcons(), 0);
  }

  private refreshIcons(): void {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  private initRevealMotion(): void {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(
      'app-home .market-entry, app-home .monetization-section, app-home .testimonials-section, app-home .services-section, app-home .partners-section, app-home .cta-section, app-home .market-entry-card, app-home .pricing-card, app-home .testi-card, app-home .service-card, app-home .plogo',
    ));

    nodes.forEach((el, index) => {
      el.classList.add('home-reveal');
      el.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 55}ms`);
    });

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    nodes.forEach(el => observer.observe(el));
  }

  private async loadSiteStats(): Promise<void> {
    try {
      const res = await fetch(`${this.API_BASE}/api/stats/overview`);
      const data = await this.safeJson(res);
      if (!res.ok) return;
      this.siteStats = {
        publishedAds: this.toStatNumber(data['publishedAds']),
        siteVisits: this.toStatNumber(data['siteVisits']),
        registeredUsers: this.toStatNumber(data['registeredUsers']),
      };
    } catch {
      this.siteStats = {
        publishedAds: this.totalListings,
        siteVisits: 0,
        registeredUsers: this.state.user() ? 1 : 0,
      };
    } finally {
      this.renderHomeStats();
    }
  }

  private renderHomeStats(): void {
    this.setText('homeRegisteredUsersStat', this.formatStat(this.siteStats.registeredUsers));
    this.setText('homePublishedAdsStat', this.formatStat(this.siteStats.publishedAds));
    this.setText('homeSiteVisitsStat', this.formatStat(this.siteStats.siteVisits));
  }

  private setText(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  private formatStat(value: number): string {
    const n = Number(value || 0);
    if (n >= 1000000) return `+${(n / 1000000).toFixed(1).replace('.0', '')}M`;
    if (n >= 1000) return `+${(n / 1000).toFixed(1).replace('.0', '')}K`;
    return String(n);
  }

  private async safeJson(res: Response): Promise<Record<string, unknown>> {
    try {
      return await res.json() as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private toStatNumber(value: unknown): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  }
}
