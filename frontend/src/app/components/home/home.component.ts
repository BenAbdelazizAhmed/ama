import { Component, effect } from '@angular/core';
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

declare const lucide: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  animals: AnimalAd[] = [];
  workers: Worker[] = [];
  products: Product[] = [];
  wholesale: WholesaleItem[] = [];
  profiles: ProfessionalProfile[] = [];
  requests: ServiceRequest[] = [];
  jobs: JobOffer[] = [];
  currentTestimonial = 0;

  testimonials = [
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

  ngAfterViewInit() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    this.initRevealMotion();
  }

  get totalAnimals() { return this.animals.length; }
  get totalWorkers() { return this.workers.length; }
  get totalProfiles() { return this.profiles.length; }
  get totalProducts() { return this.products.length; }
  get totalListings() { return this.animals.length + this.products.length + this.wholesale.length; }

  goPost() {
    void this.router.navigate(['/animals']);
  }

  browseAds() {
    void this.router.navigate(['/animals']);
  }

  prevTesti() {
    this.currentTestimonial = this.currentTestimonial === 0 ? this.testimonials.length - 1 : this.currentTestimonial - 1;
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 0);
  }

  nextTesti() {
    this.currentTestimonial = this.currentTestimonial === this.testimonials.length - 1 ? 0 : this.currentTestimonial + 1;
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 0);
  }

  private initRevealMotion() {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(
      'app-home .home-trust-strip, app-home .market-entry, app-home .home-process, app-home .why-section, app-home .monetization-section, app-home .testimonials-section, app-home .services-section, app-home .partners-section, app-home .cta-section, app-home .home-trust-strip > div, app-home .market-entry-card, app-home .process-card, app-home .why-card, app-home .pricing-card, app-home .testi-card, app-home .service-card, app-home .plogo',
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
}
