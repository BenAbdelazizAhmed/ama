import { Component, HostListener, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StateService, WholesaleItem } from '../../services/state.service';

declare const lucide: any;

@Component({
  selector: 'app-wholesale',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './wholesale.component.html',
  styleUrls: ['./wholesale.component.css'],
})
export class WholesaleComponent implements OnDestroy {
  items: WholesaleItem[] = [];
  showForm = false;
  form: Partial<WholesaleItem> = {};
  private pendingOpenForm = false;

  constructor(public state: StateService) {
    effect(() => { this.items = state.wholesale(); });
  }

  public ngAfterViewInit(): void {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  public ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('window:amanafarm-authenticated', ['$event'])
  public onAuthenticated(event?: CustomEvent<{ action?: string }>): void {
    const action = event?.detail?.action || sessionStorage.getItem('amanafarm-pending-action');
    if (!this.pendingOpenForm && action !== 'wholesale-add') return;
    this.pendingOpenForm = false;
    sessionStorage.removeItem('amanafarm-pending-action');
    setTimeout(() => this.openForm(), 80);
  }

  public openForm(): void {
    if (!this.requireLogin('wholesale-add')) return;
    this.showForm = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const first = document.querySelector<HTMLInputElement>('#wholesaleForm input');
      first?.focus();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 40);
  }

  public closeForm(): void {
    this.showForm = false;
    document.body.style.overflow = '';
  }

  public async addItem(): Promise<void> {
    if (!this.requireLogin('wholesale-add')) return;
    const w: WholesaleItem = {
      id: Date.now(), title: this.form.title || '', category: this.form.category || '',
      description: this.form.description || '', price: this.form.price || 0,
      priceUnit: this.form.priceUnit || '', minQuantity: this.form.minQuantity || 1,
      location: this.form.location || '', supplierName: this.form.supplierName || '',
      imageUrl: this.form.imageUrl || '', contactPhone: this.form.contactPhone || '',
      userId: 0, createdAt: new Date().toISOString(),
    };
    await this.state.addWholesale(w);
    this.closeForm();
    this.form = {};
  }

  public async deleteItem(id: number): Promise<void> {
    if (!this.requireLogin()) return;
    await this.state.deleteWholesale(id);
  }

  public trackById(_: number, item: WholesaleItem): number {
    return item.id;
  }

  private requireLogin(action = ''): boolean {
    if (this.state.user()) return true;
    this.pendingOpenForm = action === 'wholesale-add';
    if (action) sessionStorage.setItem('amanafarm-pending-action', action);
    window.dispatchEvent(new CustomEvent('amanafarm-login-required', { detail: { action } }));
    return false;
  }
}
