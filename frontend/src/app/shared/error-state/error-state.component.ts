import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  templateUrl: './error-state.component.html',
  styleUrls: ['./error-state.component.scss'],
})
export class ErrorStateComponent {
  @Input() title = 'حدث خطأ أثناء تحميل البيانات';
  @Input() subtitle = 'تأكد من الاتصال ثم أعد المحاولة.';
  @Output() retry = new EventEmitter<void>();
}
