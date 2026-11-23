import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeControls } from '../../shared/components/theme-controls/theme-controls';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeControls],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  readonly year = new Date().getFullYear();
  menuOpen = false;

  constructor(readonly auth: AuthService, private readonly router: Router) {}

  get pageTitle(): string {
    const path = this.router.url.split('?')[0].replace(/\/$/, '');
    const titles: Record<string, string> = {
      '/admin': 'Dashboard',
      '/admin/profile': 'Profile',
      '/admin/projects': 'Projects',
      '/admin/skills': 'Skills',
      '/admin/experiences': 'Experiences',
      '/admin/education': 'Education',
      '/admin/messages': 'Messages',
    };
    return titles[path] ?? 'Administration';
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    this.auth.logout().subscribe({ error: () => undefined });
  }
}
