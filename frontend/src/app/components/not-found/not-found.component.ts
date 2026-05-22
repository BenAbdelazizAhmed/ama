import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="not-found-page" aria-labelledby="not-found-title">
      <div class="not-found-page__grain" aria-hidden="true"></div>
      <div class="not-found-page__card">
        <p class="not-found-page__kicker">404 · طريق مسدود</p>
        <h1 id="not-found-title">الصفحة هاذي ما لقيناهاش</h1>
        <p>تنجم ترجع للسوق وتكمل تلقى حيوانات، برودويات، وخدمات فلاحية في كامل تونس.</p>
        <div class="not-found-page__actions">
          <a routerLink="/" class="nf-btn nf-btn--primary">الرئيسية</a>
          <a routerLink="/animals" class="nf-btn">سوق الحيوانات</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .not-found-page {
      min-height: 72vh;
      position: relative;
      display: grid;
      place-items: center;
      padding: clamp(28px, 7vw, 90px);
      overflow: hidden;
      background:
        radial-gradient(circle at 20% 16%, rgba(210, 154, 42, .22), transparent 32%),
        radial-gradient(circle at 82% 72%, rgba(14, 95, 54, .2), transparent 34%),
        #f5f3e8;
      color: #122016;
      direction: rtl;
    }
    .not-found-page__grain {
      position: absolute;
      inset: 0;
      opacity: .13;
      pointer-events: none;
      background-image: linear-gradient(45deg, rgba(18, 32, 22, .18) 1px, transparent 1px);
      background-size: 14px 14px;
    }
    .not-found-page__card {
      position: relative;
      width: min(760px, 100%);
      padding: clamp(28px, 5vw, 58px);
      border-radius: 34px;
      background: rgba(255, 255, 255, .78);
      border: 1px solid rgba(255,255,255,.72);
      box-shadow: 0 34px 90px rgba(12, 48, 30, .14);
      text-align: center;
    }
    .not-found-page__kicker {
      margin: 0 0 12px;
      color: #9a6b16;
      font-weight: 900;
      letter-spacing: 0;
    }
    h1 {
      margin: 0;
      font-family: "Aref Ruqaa Ink", serif;
      font-size: clamp(42px, 8vw, 92px);
      line-height: 1.05;
    }
    p {
      margin: 18px auto 0;
      max-width: 560px;
      color: #536357;
      font: 600 15px/1.9 "Readex Pro", sans-serif;
    }
    .not-found-page__actions {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 28px;
    }
    .nf-btn {
      min-height: 46px;
      padding: 0 22px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      border: 1px solid rgba(18, 32, 22, .12);
      color: #122016;
      font-weight: 900;
      text-decoration: none;
    }
    .nf-btn--primary {
      background: #12351f;
      color: #fff;
      border-color: transparent;
      box-shadow: 0 16px 32px rgba(18, 53, 31, .18);
    }
  `],
})
export class NotFoundComponent {}
