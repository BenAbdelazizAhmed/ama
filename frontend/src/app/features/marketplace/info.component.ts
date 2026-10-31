import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { IconComponent } from "../../shared/icon/icon.component";
@Component({
  selector: "app-info",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  templateUrl: "./info.component.html",
  styles: [":host{display:block}"],
})
export class InfoComponent {
  page = "about";
  query = "";
  readonly faqs = [
    {
      q: "كيفاش ننشر إعلان؟",
      a: "اضغط «انشر إعلانك»، اختار القسم وسجّل الدخول. كمّل الوصف، الولاية، السعر والهاتف، وزيد الصور من جهازك. الإعلان يظهر كان بعد تأكيد الحفظ من السيرفر.",
    },
    {
      q: "كيفاش نعدّل ولا نفسخ إعلاني؟",
      a: "ادخل للحساب ثم «إعلاناتي»، وافتح الإعلان. تلقى أزرار التعديل والفسخ كان إذا إنت صاحب الإعلان.",
    },
    {
      q: "هل النشر مجاني؟",
      a: "نعم. نشر الإعلانات والرحلات في النسخة الحالية مجاني. المنصة ما تستخلصش فلوس البيع ولا النقل.",
    },
    {
      q: "كيفاش نخدم بالمفضّلة؟",
      a: "بعد تسجيل الدخول، اضغط القلب على أي إعلان. تلقى الإعلانات المحفوظة في حسابك، وتتخزّن مع الحساب باش ترجع لها من جهاز آخر.",
    },
    {
      q: "شنوة يعني النقل المشترك؟",
      a: "صاحب الرحلة يعرض المسار، الموعد، نوع الحيوان والسعر للحيوان. إنت تتصل بيه واتّفقوا على العدد والتجهيزات والمرافقة. ما فماش حجز ولا خلاص إلكتروني على المنصة.",
    },
    {
      q: "كيفاش نبدّل كلمة المرور؟",
      a: "من «الحساب» ثم «معلومات الحساب»، اكتب كلمة المرور الحالية والجديدة. إذا نسيت القديمة، تواصل مع الدعم؛ ما نطلبوش منك تبعثلنا كلمة مرورك.",
    },
    {
      q: "علاش ما نلقاش نتائج؟",
      a: "جرّب تمسح بعض الفلاتر، تبدّل الولاية أو كلمة البحث. إذا فما مشكل اتصال تظهر رسالة إعادة المحاولة. النتائج الفارغة موش إعلانات تجريبية.",
    },
    {
      q: "شنوة يلزمني نثبّت قبل الشراء؟",
      a: "عاين السلعة، تثبّت من المعلومات والوثائق اللازمة، واتّفق على السعر والنقل قبل الخلاص. ما تبعثش معلومات حسابك ولا كلمة مرورك لأي طرف.",
    },
  ];
  constructor(route: ActivatedRoute) {
    route.data.subscribe((d) => (this.page = d["page"] || "about"));
  }
  get filtered() {
    const q = this.query.trim().toLowerCase();
    return this.faqs.filter(
      (f) => !q || (f.q + " " + f.a).toLowerCase().includes(q),
    );
  }
}
