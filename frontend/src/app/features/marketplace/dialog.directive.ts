import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  Output,
} from "@angular/core";
@Directive({ selector: "[appDialog]", standalone: true })
export class DialogDirective implements AfterViewInit, OnDestroy {
  @Output() appDialogClose = new EventEmitter<void>();
  private previous = document.activeElement as HTMLElement | null;
  private overflow = document.body.style.overflow;
  private timer?: ReturnType<typeof setTimeout>;
  constructor(private el: ElementRef<HTMLElement>) {}
  ngAfterViewInit() {
    document.body.style.overflow = "hidden";
    this.el.nativeElement.tabIndex = -1;
    this.timer = setTimeout(() => this.el.nativeElement.focus());
  }
  @HostListener("keydown", ["$event"]) key(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.appDialogClose.emit();
    }
    if (event.key === "Tab") {
      const controls = Array.from(
        this.el.nativeElement.querySelectorAll<HTMLElement>(
          "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])",
        ),
      ).filter((e) => e.getClientRects().length);
      const first = controls[0],
        last = controls[controls.length - 1];
      if (!controls.length) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === this.el.nativeElement)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === this.el.nativeElement)
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  }
  ngOnDestroy() {
    clearTimeout(this.timer);
    document.body.style.overflow = this.overflow;
    this.previous?.focus();
  }
}
