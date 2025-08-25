import {
  Component, ViewEncapsulation, HostListener,
  Renderer2, Inject, ElementRef, ViewChild, AfterViewInit
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements AfterViewInit {
  sidebarHidden = false;
  searchShow = false;
  profileShow = false;

  @ViewChild('profileBtn') profileBtn!: ElementRef<HTMLElement>;
  @ViewChild('profileMenu') profileMenu!: ElementRef<HTMLElement>;

  constructor(private r: Renderer2, @Inject(DOCUMENT) private doc: Document) {}

  toggleSidebar() { this.sidebarHidden = !this.sidebarHidden; }
  toggleSearch(ev: Event) { if (innerWidth < 768) { ev.preventDefault(); this.searchShow = !this.searchShow; } }
  setDark(checked: boolean) { checked ? this.r.addClass(this.doc.body, 'dark') : this.r.removeClass(this.doc.body, 'dark'); }
  toggleProfile(ev: Event) { ev.preventDefault(); this.profileShow = !this.profileShow; }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const t = ev.target as Node;
    const inProfile = this.profileBtn?.nativeElement.contains(t) || this.profileMenu?.nativeElement.contains(t);
    if (!inProfile) this.profileShow = false;
  }

  private adjustSidebar() { this.sidebarHidden = innerWidth <= 576; }
  @HostListener('window:resize') onResize() { this.adjustSidebar(); }
  ngAfterViewInit() { this.adjustSidebar(); }
}
