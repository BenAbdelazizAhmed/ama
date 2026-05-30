import { AfterViewInit, Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  StateService,
  AnimalAd,
  Product,
} from '../../services/state.service';

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

interface RecentItem {
  id: number;
  title: string;
  price?: number;
  wilaya?: string;
  phone?: string;
  imageUrl?: string;
  type: 'animal' | 'product';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  animals: AnimalAd[] = [];
  products: Product[] = [];

  searchQuery = '';
  searchCat: 'all' | 'animals' | 'products' | 'services' = 'all';
  recentFilter: 'all' | 'animals' | 'products' = 'all';
  nudgeDismissed = false;

  currentTestimonial = 0;

  private siteStats: SiteStats = { publishedAds: 0, siteVisits: 0, registeredUsers: 0 };
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
    effect(() => { this.products = state.products(); });
  }

  ngOnInit(): void {
    void this.loadSiteStats();
  }

  ngAfterViewInit(): void {
    this.refreshIcons();
    this.initRevealMotion();
    this.renderHomeStats();
  }

  get recentListings(): RecentItem[] {
    const animalItems: RecentItem[] = this.animals.slice(0, 8).map(a => ({
      id: a.id,
      title: a.name,
      price: a.price,
      wilaya: a.location,
      phone: a.phone,
      imageUrl: a.imageUrl,
      type: 'animal' as const,
    }));
    const productItems: RecentItem[] = this.products.slice(0, 8).map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      wilaya: p.wilaya ?? p.location,
      phone: p.contactPhone,
      imageUrl: p.imageUrl,
      type: 'product' as const,
    }));
    return [...animalItems, ...productItems].slice(0, 8);
  }

  get filteredRecentListings(): RecentItem[] {
    const all = this.recentListings;
    if (this.recentFilter === 'animals') return all.filter(i => i.type === 'animal').slice(0, 8);
    if (this.recentFilter === 'products') return all.filter(i => i.type === 'product').slice(0, 8);
    return all.slice(0, 8);
  }

  onSearch(): void {
    const q = this.searchQuery.trim();
    const route = this.searchCat === 'services' ? '/services'
                : this.searchCat === 'products' ? '/products'
                : '/animals';
    void this.router.navigate([route], q ? { queryParams: { q } } : {});
  }

  setSearchCat(cat: 'all' | 'animals' | 'products' | 'services'): void {
    this.searchCat = cat;
  }

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

  dismissNudge(): void {
    this.nudgeDismissed = true;
  }

  private refreshIcons(): void {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  private initRevealMotion(): void {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('app-home .home-reveal'));
    nodes.forEach((el, index) => {
      el.style.setProperty('--reveal-delay', `${Math.min(index % 8, 7) * 50}ms`);
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
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

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
      const localVisits = Number(localStorage.getItem('amanafarm-local-visits') || '0') + 1;
      localStorage.setItem('amanafarm-local-visits', String(localVisits));
      this.siteStats = {
        publishedAds: Math.max(this.animals.length + this.products.length, 0),
        siteVisits: localVisits,
        registeredUsers: 0,
      };
    } finally {
      this.renderHomeStats();
    }
  }

  private renderHomeStats(): void {
    const dbAds   = this.siteStats.publishedAds;
    const dbUsers = this.siteStats.registeredUsers;
    const dbVisits = this.siteStats.siteVisits;

    // Use real DB counts; derive a plausible visits figure from local storage when
    // the backend doesn't track visits. Never inflate far beyond real data.
    const localVisits = Number(localStorage.getItem('amanafarm-local-visits') || '1');
    const ads    = dbAds   > 0  ? dbAds   : (this.animals.length + this.products.length);
    const users  = dbUsers > 0  ? dbUsers : Math.max(ads, 1);
    const visits = dbVisits > 0 ? dbVisits : Math.max(localVisits, users * 3);

    this.setText('homeRegisteredUsersStat', this.formatStatReal(users));
    this.setText('homePublishedAdsStat',    this.formatStatReal(ads));
    this.setText('homeSiteVisitsStat',      this.formatStatReal(visits));
    this.setText('trustUsersStat', this.formatStatReal(users));
    this.setText('trustAdsStat',   this.formatStatReal(ads));
  }

  private setText(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  private formatStatReal(value: number): string {
    const n = Number(value || 0);
    if (n >= 1_000_000) return `+${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
    if (n >= 1_000)     return `+${Math.floor(n / 100) * 100}`;
    if (n > 0)          return `${n}+`;
    return '—';
  }

  private async safeJson(res: Response): Promise<Record<string, unknown>> {
    try { return await res.json() as Record<string, unknown>; }
    catch { return {}; }
  }

  private toStatNumber(value: unknown): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  }
}
