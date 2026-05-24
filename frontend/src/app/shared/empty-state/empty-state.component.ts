import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [NgIf],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  @Input() icon = '🌾';
  @Input() title = 'لا توجد نتائج';
  @Input() subtitle = 'جرّب تغيير الفلاتر أو البحث بكلمات أخرى.';
  @Input() showReset = false;
  @Output() reset = new EventEmitter<void>();
}
