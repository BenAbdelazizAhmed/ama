import { Component, effect } from '@angular/core';
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
export class WholesaleComponent {
  items: WholesaleItem[] = [];
  showForm = false;
  form: Partial<WholesaleItem> = {};

  constructor(public state: StateService) {
    effect(() => { this.items = state.wholesale(); });
  }

  ngAfterViewInit() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  async addItem() {
    const w: WholesaleItem = {
      id: Date.now(), title: this.form.title || '', category: this.form.category || '',
      description: this.form.description || '', price: this.form.price || 0,
      priceUnit: this.form.priceUnit || '', minQuantity: this.form.minQuantity || 1,
      location: this.form.location || '', supplierName: this.form.supplierName || '',
      imageUrl: this.form.imageUrl || '', contactPhone: this.form.contactPhone || '',
      userId: 0, createdAt: new Date().toISOString(),
    };
    await this.state.addWholesale(w);
    this.showForm = false;
    this.form = {};
  }

  async deleteItem(id: number) {
    await this.state.deleteWholesale(id);
  }

  trackById(_: number, item: WholesaleItem) {
    return item.id;
  }
}
