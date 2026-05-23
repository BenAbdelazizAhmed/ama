import { Component, effect, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements AfterViewInit {
  totalAnimals = 0;
  totalWorkers = 0;
  totalProducts = 0;
  totalWholesale = 0;

  constructor(public state: StateService) {
    effect(() => { this.totalAnimals = state.animals().length; });
    effect(() => { this.totalWorkers = state.workers().length; });
    effect(() => { this.totalProducts = state.products().length; });
    effect(() => { this.totalWholesale = state.wholesale().length; });
  }

  ngAfterViewInit() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          const parent = entry.target.parentElement;
          if (parent) {
            const siblings = parent.querySelectorAll('.about-fade-up');
            siblings.forEach((el, i) => {
              if (!el.classList.contains('visible')) {
                setTimeout(() => el.classList.add('visible'), i * 80);
              }
            });
          }
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.about-fade-up').forEach(el => observer.observe(el));
  }

  get totalListings() { return this.totalAnimals + this.totalProducts + this.totalWholesale; }

  openAddPanel() {
    if (!this.state.user()) {
      window.dispatchEvent(new CustomEvent('amanafarm-login-required'));
      return;
    }
    window.location.href = '/';
  }
}
