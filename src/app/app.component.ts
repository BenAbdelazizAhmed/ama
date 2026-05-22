import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="page" dir="rtl">

    <header class="topbar">
      <div class="logo">
        <div class="shield">🐐</div>
        <div>
          <h1>AMANA</h1>
          <p>منصة الثقة في الفلاحة وأموالنا التونسية</p>
        </div>
      </div>

      <div class="search">
        <input placeholder="ابحث عن حيوان، منتج، خدمة..." />
        <button>بحث</button>
      </div>

      <div class="icons">
        <div class="icon"><span>🔔</span><b>3</b><small>الإشعارات</small></div>
        <div class="icon"><span>✉️</span><b>5</b><small>الرسائل</small></div>
        <div class="icon"><span>♡</span><small>المفضلة</small></div>
        <div class="icon"><span>🛒</span><b>2</b><small>سلة التسوق</small></div>
        <div class="profile">
          <img src="https://i.pravatar.cc/80?img=12">
          <div>مرحبا، محمد<br><strong>حسابي</strong></div>
        </div>
        <button class="lang">AR⌄</button>
      </div>
    </header>

    <nav class="nav">
      <a class="active">الرئيسية</a>
      <a>مرحبا</a>
      <a>السوق</a>
      <a>النقل</a>
      <a>البيطرة</a>
      <a>الصيدلية</a>
      <a>الأعلاف و منتجات</a>
      <a>التكوين</a>
      <a>الاستثمار</a>
      <a>المجتمع</a>
      <a>المزيد</a>
    </nav>

    <section class="hero">
      <img class="sheep" src="assets/hero-sheep.png" />

      <div class="rating-card">
        <div class="avatars">
          <img src="https://i.pravatar.cc/30?img=1">
          <img src="https://i.pravatar.cc/30?img=2">
          <img src="https://i.pravatar.cc/30?img=3">
          <strong>+12K</strong>
        </div>
        <p>مستخدم نشط</p>
        <h3>4.9 ⭐⭐⭐⭐⭐</h3>
        <small>تقييم المنصة</small>
      </div>

      <div class="hero-text">
        <h2>كل ما تحتاجه في عالم<br><span>الفلاحة و الحيوانات</span></h2>
        <p>
          منصة متكاملة تجمع بين المربين، المشترين، و جميع الخدمات
          لتطوير و تسهيل تربية الحيوانات و الاستثمار في الفلاحة
        </p>

        <div class="hero-actions">
          <button class="green">تصفح السوق 🛍️</button>
          <button>أضف إعلانك ＋</button>
          <button>خدمات النقل 🚚</button>
        </div>
      </div>

      <div class="secure-card">
        <div class="secure-icon">🛡️</div>
        <h3>معاملات آمنة 100%</h3>
        <p>نضمن لك الأمان والثقة في كل عملية على المنصة</p>
        <ul>
          <li>✓ بائعون موثوقون</li>
          <li>✓ دعم فني</li>
          <li>✓ دعم 24/7</li>
        </ul>
        <button>تعرف على المزيد</button>
      </div>
    </section>

    <section class="categories">
      <div class="cat active-cat"><span>▦</span><p>جميع الأقسام</p></div>
      <div class="cat"><span>🐝</span><p>نحل و طيور</p></div>
      <div class="cat"><span>🐶</span><p>كلاب و قطط</p></div>
      <div class="cat"><span>🐰</span><p>أرانب</p></div>
      <div class="cat"><span>🐓</span><p>دواجن</p></div>
      <div class="cat"><span>🐐</span><p>ماعز</p></div>
      <div class="cat"><span>🐄</span><p>أبقار</p></div>
      <div class="cat"><span>🐴</span><p>خيل</p></div>
      <div class="cat"><span>🐪</span><p>جمال</p></div>
      <div class="cat"><span>🐑</span><p>أغنام و خراف</p></div>
    </section>

    <main class="content">

      <aside class="quick">
        <h3>خدمات سريعة</h3>
        <div class="quick-item">🚚 <div><b>حجز نقل الحيوانات</b><small>احجز شاحنة متخصصة</small></div></div>
        <div class="quick-item">🩺 <div><b>استشارة بيطرية</b><small>دردشة أو فيديو مع طبيب</small></div></div>
        <div class="quick-item">💊 <div><b>الصيدلية البيطرية</b><small>أدوية و فيتامينات أصلية</small></div></div>
        <div class="quick-item">📍 <div><b>تتبع الحيوانات</b><small>تتبع صحة و موقع حيواناتك</small></div></div>
      </aside>

      <section class="market">
        <div class="section-title">
          <h3>أحدث الإعلانات</h3>
          <a>عرض الكل</a>
        </div>

        <div class="cards">
          <div class="card" *ngFor="let item of animals">
            <div class="imgbox">
              <img [src]="item.img">
              <span class="badge">{{item.badge}}</span>
              <button class="heart">♡</button>
            </div>
            <h4>{{item.title}}</h4>
            <p>📍 {{item.place}}</p>
            <div class="price">
              <span>{{item.weight}}</span>
              <strong>{{item.price}}</strong>
            </div>
          </div>
        </div>
      </section>

      <aside class="orders">
        <div class="section-title">
          <h3>تتبع طلباتك</h3>
          <a>عرض الكل</a>
        </div>

        <div class="order green-text">✅ خروف سيدي ممتاز <span>تم تأكيد الطلب</span></div>
        <div class="order orange-text">🚚 نقل من سوسة إلى تونس <span>جاري الشحن</span></div>
        <div class="order green-text">💊 أدوية بيطرية <span>تم التوصيل</span></div>

        <div class="invest">
          <h3>استثمر في مشاريع مربحة</h3>
          <p>اكتشف أفضل فرص الاستثمار في تربية الحيوانات والفلاحة</p>
          <button>استثمر الآن</button>
        </div>
      </aside>

      <section class="map-box">
        <h3>المناطق النشطة</h3>
        <div class="map">
          <div class="pin p1">●</div>
          <div class="pin p2">●</div>
          <div class="pin p3">●</div>
          <div class="pin p4">●</div>
          <div class="tunisia">تونس</div>
        </div>
      </section>

      <section class="features">
        <div>🏅 <b>بائعون موثوقون</b><small>جميع البائعين تم التحقق منهم</small></div>
        <div>🚚 <b>توصيل سريع و آمن</b><small>نضمن وصول طلباتك بأمان وسرعة</small></div>
        <div>💵 <b>أسعار تنافسية</b><small>أفضل الأسعار في السوق</small></div>
      </section>

      <section class="stats">
        <img src="https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?q=80&w=500">
        <div><b>+25K</b><small>مستخدم نشط</small></div>
        <div><b>+15K</b><small>إعلان منشور</small></div>
        <div><b>+8K</b><small>عملية ناجحة</small></div>
        <div><b>24/7</b><small>دعم فني</small></div>
      </section>

      <section class="review">
        <div class="user">
          <img src="https://i.pravatar.cc/80?img=11">
          <div>
            <b>علي بن محمد</b>
            <small>مربي أغنام - القيروان</small>
          </div>
        </div>
        <h3>ماذا يقول عملاؤنا</h3>
        <p>تقييم ممتاز</p>
        <h2>4.9 / 5</h2>
        <div class="stars">⭐⭐⭐⭐⭐</div>
      </section>

      <section class="testimonial">
        <p>“ منصة آمنة و موثوقة، وجدت كل ما أحتاجه لمزرعتي في مكان واحد ”</p>
        <div class="dots">● ● ● ○ ○</div>
      </section>

      <section class="mobile">
        <img src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=400">
      </section>

    </main>

    <section class="partners">
      <b>شركاؤنا</b>
      <span>ATB</span>
      <span>STAFIM</span>
      <span>SOTUVER</span>
      <span>AgriTech</span>
      <span>TAWASOL</span>
      <span>COMAR</span>
      <span>SNA</span>
    </section>

    <footer>
      <div>● ● ● ● ●</div>
      <p>AMANA 2024 / 2024 © جميع الحقوق محفوظة</p>
      <h2>AMANA</h2>
    </footer>

  </div>
  `,
  styles: [`
    *{box-sizing:border-box}
    .page{font-family:"Cairo","Segoe UI",Arial,sans-serif;background:#f7f9f7;color:#17251b;min-height:100vh}
    .topbar{height:88px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 48px;border-bottom:1px solid #e8ece8;gap:30px}
    .logo{display:flex;align-items:center;gap:12px;direction:ltr}
    .shield{width:48px;height:48px;background:#24883c;color:#fff;border-radius:14px;display:grid;place-items:center;font-size:27px}
    .logo h1{margin:0;color:#0b5b26;font-size:38px;font-weight:900;letter-spacing:1px}
    .logo p{margin:0;color:#17723a;font-size:11px;font-weight:700}
    .search{width:430px;height:48px;border:1px solid #dfe5df;border-radius:12px;background:#fff;display:flex;overflow:hidden;box-shadow:0 2px 8px #00000008}
    .search input{flex:1;border:0;padding:0 20px;font-size:15px;outline:0;text-align:right}
    .search button{width:70px;margin:6px;background:#0f6b31;color:#fff;border:0;border-radius:9px;font-weight:800;font-size:15px}
    .icons{display:flex;align-items:center;gap:22px}
    .icon{position:relative;text-align:center;font-size:18px;color:#202020}
    .icon b{position:absolute;top:-9px;right:10px;background:#137534;color:#fff;border-radius:20px;font-size:11px;width:20px;height:20px;display:grid;place-items:center}
    .icon small{display:block;font-size:12px;margin-top:4px;color:#222}
    .profile{display:flex;align-items:center;gap:10px;border-right:1px solid #eee;padding-right:20px;font-size:13px}
    .profile img{width:52px;height:52px;border-radius:50%}
    .lang{border:1px solid #ddd;background:#fff;border-radius:8px;padding:10px 16px;font-weight:800}
    .nav{height:48px;background:#fff;display:flex;justify-content:center;gap:45px;border-bottom:1px solid #eee}
    .nav a{height:48px;display:flex;align-items:center;font-size:14px;color:#252525;text-decoration:none}
    .nav .active{color:#126c32;border-bottom:4px solid #126c32;font-weight:900}
    .hero{height:310px;position:relative;background:linear-gradient(90deg,#dcead7,#f8fbf7 38%,#eaf3e7);overflow:hidden}
    .hero:before{content:"";position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1800') center/cover;opacity:.28;filter:blur(1px)}
    .sheep{position:absolute;left:150px;bottom:-25px;height:335px;width:400px;object-fit:cover;object-position:center;border-radius:8px}
    .hero-text{position:absolute;top:44px;left:50%;transform:translateX(-50%);text-align:center;width:560px}
    .hero-text h2{font-size:43px;line-height:1.25;margin:0 0 10px;font-weight:900;color:#080808}
    .hero-text h2 span{color:#0e7133}
    .hero-text p{font-size:17px;line-height:1.8;margin:0;color:#202020;font-weight:600}
    .hero-actions{display:flex;gap:18px;justify-content:center;margin-top:25px}
    .hero-actions button{width:190px;height:47px;border:0;border-radius:8px;background:#fff;color:#111;box-shadow:0 6px 18px #0002;font-size:16px;font-weight:800}
    .hero-actions .green{background:#0f7133;color:#fff}
    .rating-card{position:absolute;left:80px;top:70px;background:#fff;width:140px;border-radius:12px;padding:18px;box-shadow:0 8px 25px #0002;text-align:center}
    .avatars{display:flex;align-items:center;gap:0;direction:ltr}
    .avatars img{width:28px;height:28px;border-radius:50%;border:2px solid #fff;margin-left:-6px}
    .avatars strong{color:#14853a;margin-left:8px}
    .rating-card p{font-size:12px;font-weight:800;margin:10px 0}
    .rating-card h3{margin:0;font-size:19px}
    .rating-card small{font-size:11px;color:#666}
    .secure-card{position:absolute;right:130px;top:35px;width:250px;height:230px;background:linear-gradient(135deg,#0c4823,#116d35);color:#fff;border-radius:14px;padding:24px;box-shadow:0 12px 30px #063d2050}
    .secure-icon{font-size:58px;opacity:.9}
    .secure-card h3{font-size:19px;margin:0 0 5px}
    .secure-card p{font-size:13px;line-height:1.7;opacity:.9}
    .secure-card ul{list-style:none;padding:0;margin:8px 0;font-size:13px;line-height:1.9}
    .secure-card button{width:100%;height:43px;border:0;border-radius:7px;background:#fff;color:#222;font-weight:900}
    .categories{width:88%;height:120px;margin:-50px auto 16px;background:#fff;border-radius:12px;box-shadow:0 8px 25px #0001;position:relative;z-index:5;display:grid;grid-template-columns:repeat(10,1fr);align-items:center;padding:0 30px}
    .cat{text-align:center;font-weight:800;font-size:13px}
    .cat span{width:58px;height:58px;background:#f4f5f4;border:1px solid #e5e5e5;border-radius:50%;display:grid;place-items:center;margin:auto;font-size:34px}
    .active-cat span{background:#edf5ef;color:#0e7133;font-size:38px}
    .content{width:88%;margin:auto;display:grid;grid-template-columns:250px 1fr 330px;gap:18px}
    .quick,.market,.orders,.map-box,.features,.review,.testimonial,.mobile,.partners{background:#fff;border:1px solid #e8ece8;border-radius:10px;box-shadow:0 2px 10px #00000008}
    .quick{padding:16px}
    .quick h3,.section-title h3{margin:0 0 12px;font-size:18px}
    .quick-item{height:53px;border:1px solid #e3e8e3;border-radius:8px;margin-bottom:8px;display:flex;align-items:center;gap:12px;padding:8px;color:#137034}
    .quick-item b{display:block;font-size:13px}
    .quick-item small{color:#777;font-size:11px}
    .market{padding:14px}
    .section-title{display:flex;justify-content:space-between;align-items:center;color:#126c32;font-weight:800}
    .section-title a{font-size:12px}
    .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
    .card{border:1px solid #e3e6e3;border-radius:8px;overflow:hidden;background:#fff}
    .imgbox{height:120px;position:relative}
    .imgbox img{width:100%;height:100%;object-fit:cover}
    .badge{position:absolute;top:8px;left:8px;background:#f3b51b;color:#111;padding:5px 10px;border-radius:6px;font-size:12px;font-weight:900}
    .heart{position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;border:0;background:#fff;font-size:22px}
    .card h4{margin:10px 12px 4px;font-size:15px}
    .card p{margin:0 12px;color:#777;font-size:12px}
    .price{display:flex;justify-content:space-between;padding:10px 12px 12px}
    .price strong{color:#087130;font-size:18px}
    .orders{padding:14px}
    .order{height:48px;border-bottom:1px solid #eee;font-weight:800;font-size:13px}
    .order span{float:left;font-size:13px}
    .green-text span{color:#148239}
    .orange-text span{color:#f39a15}
    .invest{height:86px;margin-top:12px;border-radius:8px;background:linear-gradient(135deg,#097335,#0c8c3d);color:#fff;padding:12px 18px;position:relative;overflow:hidden}
    .invest:after{content:"📈💰";position:absolute;left:12px;bottom:8px;font-size:42px}
    .invest h3{margin:0;font-size:16px}
    .invest p{font-size:12px;margin:5px 0}
    .invest button{border:0;background:#fff;color:#137034;border-radius:4px;padding:4px 18px;font-weight:900}
    .map-box{grid-column:1/2;padding:15px;height:145px}
    .map{height:100px;background:#edf6ed;border-radius:8px;position:relative;overflow:hidden}
    .tunisia{position:absolute;inset:0;display:grid;place-items:center;color:#83aa8a;font-size:34px;font-weight:900}
    .pin{position:absolute;color:#0c7534;font-size:25px;z-index:2}
    .p1{top:15px;right:70px}.p2{top:55px;right:130px}.p3{top:35px;left:70px}.p4{bottom:10px;left:120px}
    .features{grid-column:2/3;height:65px;display:grid;grid-template-columns:repeat(3,1fr);align-items:center;text-align:center}
    .features b{display:block;color:#135f31;font-size:14px}
    .features small{font-size:11px;color:#777}
    .stats{grid-column:2/3;background:linear-gradient(90deg,#0b6b31,#08833c);height:72px;border-radius:8px;color:#fff;display:grid;grid-template-columns:1.5fr repeat(4,1fr);align-items:center;text-align:center;overflow:hidden}
    .stats img{width:100%;height:100%;object-fit:cover}
    .stats b{display:block;font-size:22px}.stats small{font-size:12px}
    .review{grid-column:3/4;grid-row:3/5;padding:18px}
    .user{display:flex;gap:10px;align-items:center}
    .user img{width:50px;height:50px;border-radius:50%}
    .user small{display:block;color:#777}
    .review h3{color:#0f7133}.review h2{margin:0}.stars{color:#f5b400}
    .testimonial{grid-column:3/4;padding:35px;text-align:center;color:#555;font-size:16px}
    .dots{color:#0f7133}
    .mobile{grid-column:3/4;height:145px;overflow:hidden;text-align:center}
    .mobile img{width:120px;height:145px;object-fit:cover;border-radius:20px;margin-top:8px}
    .partners{width:88%;height:68px;margin:14px auto;display:flex;align-items:center;gap:35px;padding:0 28px;font-weight:900;color:#195c34}
    .partners span{font-size:20px;color:#2a6f95}
    footer{width:88%;height:48px;margin:auto;background:#08652e;color:#fff;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:space-between;padding:0 35px}
    footer h2{font-size:27px;margin:0}

    @media(max-width:1000px){
      .topbar{height:auto;padding:15px;flex-direction:column}
      .search{width:100%}
      .icons,.nav{display:none}
      .hero{height:520px}
      .sheep{left:10px;width:260px;height:260px}
      .hero-text{width:95%;top:180px}
      .hero-text h2{font-size:30px}
      .secure-card,.rating-card{display:none}
      .categories{width:95%;grid-template-columns:repeat(5,1fr);height:auto;padding:15px;margin:-30px auto 15px}
      .content{width:95%;grid-template-columns:1fr}
      .cards{grid-template-columns:1fr 1fr}
      .map-box,.features,.stats,.review,.testimonial,.mobile{grid-column:auto;grid-row:auto}
      .partners,footer{width:95%;overflow:auto}
    }
  `]
})
export class AppComponent  {
  animals = [
    {
      title: 'خروف سيدي ممتاز',
      place: 'القيروان',
      weight: '55 كغ',
      price: '1,450 د.ت',
      badge: 'مميز',
      img: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?q=80&w=500'
    },
    {
      title: 'بقرة حلوب - هولشتاين',
      place: 'بن عروس',
      weight: '450 كغ',
      price: '6,800 د.ت',
      badge: 'جديد',
      img: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?q=80&w=500'
    },
    {
      title: 'دجاج بلدي',
      place: 'نابل',
      weight: '',
      price: '15 د.ت',
      badge: 'جديد',
      img: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=500'
    },
    {
      title: 'ماعز أرضي - ذكر',
      place: 'سيدي بوزيد',
      weight: '38 كغ',
      price: '1,250 د.ت',
      badge: 'مميز',
      img: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?q=80&w=500'
    }
  ];
}