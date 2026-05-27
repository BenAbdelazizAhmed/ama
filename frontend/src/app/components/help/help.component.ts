import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

declare const lucide: any;

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
})
export class HelpComponent implements AfterViewInit {
  faqs = [
    { q: 'كيفاش ننشر إعلان؟', a: 'اختار الحيوانات أو المنتجات، اضغط نشر إعلان، وكمّل الصور والسعر والولاية.' },
    { q: 'هل التواصل مباشر؟', a: 'نعم، صفحة التفاصيل فيها زر WhatsApp وزر تواصل مع البائع.' },
    { q: 'شنوة يعني بائع موثوق؟', a: 'شارة ثقة تظهر للبائعين أو الشركاء الذين يقدمون معلومات واضحة ونشاط جدي.' },
    { q: 'هل الإعلان مجاني؟', a: 'الإعلان العادي مجاني، والـ Boost اختياري لزيادة الظهور.' },
  ];

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  }
}
