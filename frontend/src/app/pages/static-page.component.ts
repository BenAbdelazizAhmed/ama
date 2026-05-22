import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  Renderer2,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { forkJoin, Subscription } from "rxjs";

interface ScriptInfo {
  src: string | null;
  content: string;
  type: string | null;
}

@Component({
  selector: "app-static-page",
  standalone: true,
  imports: [CommonModule],
  template: `<div #host [innerHTML]="pageHtml"></div>`,
})
export class StaticPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild("host", { static: true }) hostRef!: ElementRef<HTMLElement>;
  pageHtml: SafeHtml = "";

  private pendingScripts: ScriptInfo[] = [];
  private activeScripts: HTMLScriptElement[] = [];
  private dataSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer,
    private readonly renderer: Renderer2,
  ) {}

  ngAfterViewInit(): void {
    this.dataSub = this.route.data.subscribe((data) => {
      const page = data["page"] as string | undefined;
      if (!page) {
        this.pageHtml = "";
        return;
      }

      const useSharedHeader = data["useSharedHeader"] !== false;
      const headerRequest = this.http.get("/pages/header.html", {
        responseType: "text",
      });
      const pageRequest = this.http.get(`/pages/${page}`, {
        responseType: "text",
      });

      forkJoin([headerRequest, pageRequest]).subscribe({
        next: ([headerHtml, pageHtml]) => {
          const combined = this.buildHtml(
            pageHtml,
            headerHtml,
            useSharedHeader,
          );
          this.pageHtml = this.sanitizer.bypassSecurityTrustHtml(combined);
          queueMicrotask(() => this.rehydrateScripts());
        },
        error: () => {
          this.pageHtml = this.sanitizer.bypassSecurityTrustHtml(
            '<div style="padding:24px;font-family:Readex Pro,sans-serif">Failed to load page.</div>',
          );
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.cleanupScripts();
    this.dataSub?.unsubscribe();
  }

  private buildHtml(
    pageHtml: string,
    headerHtml: string,
    useSharedHeader: boolean,
  ): string {
    this.pendingScripts = [];
    const doc = new DOMParser().parseFromString(pageHtml, "text/html");
    const headAssets: string[] = [];

    doc.head
      .querySelectorAll(
        'style,link[rel="stylesheet"],link[rel="preconnect"],link[rel="canonical"],meta,script',
      )
      .forEach((node) => {
        const tag = node.tagName.toLowerCase();
        if (tag === "script") {
          const scriptNode = node as HTMLScriptElement;
          this.pendingScripts.push({
            src: scriptNode.getAttribute("src"),
            content: scriptNode.textContent || "",
            type: scriptNode.getAttribute("type"),
          });
        } else {
          headAssets.push(node.outerHTML);
        }
      });

    if (doc.body) {
      doc.body.querySelectorAll("script").forEach((node) => {
        const scriptNode = node as HTMLScriptElement;
        this.pendingScripts.push({
          src: scriptNode.getAttribute("src"),
          content: scriptNode.textContent || "",
          type: scriptNode.getAttribute("type"),
        });
        node.remove();
      });

      if (useSharedHeader) {
        const toastWrap = doc.body.querySelector(".toast-wrap");
        if (toastWrap) toastWrap.remove();
        const annBar = doc.body.querySelector(".ann-bar");
        if (annBar) annBar.remove();
        const topbar = doc.body.querySelector(".topbar");
        if (topbar) topbar.remove();
        const header = doc.body.querySelector("header");
        if (header) header.remove();
        const nav = doc.body.querySelector("nav");
        if (nav) nav.remove();
      }
    }

    const bodyContent = doc.body ? doc.body.innerHTML : pageHtml;
    const sharedHeader = useSharedHeader ? headerHtml : "";

    return `${headAssets.join("\n")}\n${sharedHeader}\n${bodyContent}`;
  }

  private rehydrateScripts(): void {
    this.cleanupScripts();

    const host = this.hostRef.nativeElement;
    this.pendingScripts.forEach((info) => {
      const script = this.renderer.createElement("script") as HTMLScriptElement;
      if (info.type) {
        script.type = info.type;
      }
      if (info.src) {
        script.src = info.src;
      } else if (info.content.trim()) {
        script.text = info.content;
      }
      this.renderer.appendChild(host, script);
      this.activeScripts.push(script);
    });

    this.pendingScripts = [];
  }

  private cleanupScripts(): void {
    this.activeScripts.forEach((script) => script.remove());
    this.activeScripts = [];
    this.pendingScripts = [];
  }
}
