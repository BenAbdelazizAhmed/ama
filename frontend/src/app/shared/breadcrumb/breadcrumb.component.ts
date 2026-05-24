import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string | unknown[];
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
