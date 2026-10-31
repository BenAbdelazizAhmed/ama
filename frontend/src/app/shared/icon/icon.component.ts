import { Component, Input } from "@angular/core";
import { NgFor } from "@angular/common";

const ICONS: Record<string, string[]> = {
  heart: [
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  ],
  camera: ["M3 7h4l2-3h6l2 3h4v14H3Z", "M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"],
  filters: ["M4 6h16M7 12h10M10 18h4"],
  grid: ["M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z"],
  list: ["M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"],
  edit: ["m15 4 5 5M3 21l4-1 14-14-4-4L3 16Z"],
  trash: ["M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"],
  share: ["M12 16V2m-5 5 5-5 5 5M5 13v8h14v-8"],
  account: ["M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2"],

  search: [
    "M21 21l-4.5-4.5",
    "M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z",
  ],
  leaf: ["M20 4C9 2 3 7 5 14c2 6 12 7 15-10Z", "M4 21 15 10"],
  sprout: [
    "M12 22V12",
    "M12 14C4 15 2 10 3 5c7-1 10 3 9 9Z",
    "M12 10c-1-6 3-9 9-8 1 6-3 10-9 8Z",
  ],
  animal: [
    "M7 7 4 3 2 6l3 5v7l3 3h8l3-3v-7l3-5-2-3-3 4Z",
    "M8 15h.01M16 15h.01",
    "M9 21v-3h6v3",
    "M8 7h8",
  ],
  grain: [
    "M12 22V5",
    "M12 9C7 9 5 6 6 3c4 0 6 2 6 6Z",
    "M12 14c-5 0-7-3-6-6 4 0 6 2 6 6Z",
    "M12 19c-5 0-7-3-6-6 4 0 6 2 6 6Z",
    "M12 11c5 0 7-3 6-6-4 0-6 2-6 6Z",
    "M12 16c5 0 7-3 6-6-4 0-6 2-6 6Z",
  ],
  truck: [
    "M1 4h13v13H1Z",
    "M14 9h4l4 4v4h-8",
    "M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
    "M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  ],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  pin: [
    "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z",
    "M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  ],
  shield: ["M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6Z", "m8 12 3 3 5-6"],
  arrow: ["M20 12H4", "m10 6-6 6 6 6"],
  diagonal: ["M18 18 6 6", "M6 17V6h11"],
  plus: ["M12 5v14M5 12h14"],
  check: ["m5 12 4 4L19 6"],
  chevron: ["m6 9 6 6 6-6"],
  message: [
    "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8Z",
  ],
  calendar: ["M3 5h18v16H3Z", "M16 3v4M8 3v4M3 11h18"],
  clock: ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z", "M12 6v6l4 2"],
  home: ["m3 10 9-7 9 7v11H3Z", "M9 21v-8h6v8"],
  package: ["m12 3 9 5v9l-9 5-9-5V8Z", "m3 8 9 5 9-5", "M12 13v9M7.5 5.5l9 5"],
  help: [
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
    "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3",
    "M12 17h.01",
  ],
  close: ["M6 6l12 12M6 18 18 6"],
  swap: ["M3 7h17l-4-4M21 17H4l4 4"],
  refresh: ["M20 7a9 9 0 1 0 1 9", "M20 2v5h-5"],
  phone: [
    "M22 16.9v3a2 2 0 0 1-2.2 2 20 20 0 0 1-8.6-3.1 19.7 19.7 0 0 1-6-6 20 20 0 0 1-3.1-8.7A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.9 2.2Z",
  ],
};

@Component({
  selector: "app-icon",
  standalone: true,
  imports: [NgFor],
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path *ngFor="let path of paths" [attr.d]="path" />
  </svg>`,
  styles: [
    ":host{display:inline-flex;align-items:center;justify-content:center;width:1.25em;height:1.25em;flex:none;vertical-align:middle}svg{display:block;width:100%;height:100%}",
  ],
})
export class IconComponent {
  @Input() name = "leaf";
  get paths() {
    return ICONS[this.name] || ICONS["leaf"];
  }
}
