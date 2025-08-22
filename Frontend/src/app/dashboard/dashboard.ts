import {
  Component,
  ViewEncapsulation,
  HostListener,
  Renderer2,
  Inject,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  encapsulation: ViewEncapsulation.None, // permite tocar body y clases globales
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  // --- Estado de UI ---
  activeIndex = 0;        
  sidebarHidden = false;   
  searchShow = false;       
  profileShow = false;     
  openMenuId: string | null = null;

  @ViewChild('profileBtn') profileBtn!: ElementRef<HTMLElement>;
  @ViewChild('profileMenu') profileMenu!: ElementRef<HTMLElement>;

  constructor(
    private r: Renderer2,
    @Inject(DOCUMENT) private doc: Document
  ) {}


  setActive(i: number, ev?: Event) {
    if (ev) ev.preventDefault();
    this.activeIndex = i;
  }

  toggleSidebar() {
    this.sidebarHidden = !this.sidebarHidden;
  }

  private adjustSidebar() {

    if (window.innerWidth <= 576) {
      this.sidebarHidden = true;
    } else {
      this.sidebarHidden = false;
    }
  }

  toggleSearch(ev: Event) {
    if (window.innerWidth < 768) {
      ev.preventDefault();
      this.searchShow = !this.searchShow;
    }
  }


  setDark(checked: boolean) {
    if (checked) this.r.addClass(this.doc.body, 'dark');
    else this.r.removeClass(this.doc.body, 'dark');
  }


  toggleProfile(ev: Event) {
    ev.preventDefault();
    this.profileShow = !this.profileShow;

  }

  // Cerrar menús si se hace click fuera
  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(ev: MouseEvent) {
    const target = ev.target as Node;
    const inProfile =
      (this.profileBtn && this.profileBtn.nativeElement.contains(target)) ||
      (this.profileMenu && this.profileMenu.nativeElement.contains(target));

    if (!inProfile) this.profileShow = false;
  }

  toggleMenu(menuId: string) {
    this.openMenuId = this.openMenuId === menuId ? null : menuId;
  }

  @HostListener('window:resize')
  onResize() {
    this.adjustSidebar();
  }

  // iniciar estado según ancho actual
  ngAfterViewInit() {
    this.adjustSidebar();
  }
}
