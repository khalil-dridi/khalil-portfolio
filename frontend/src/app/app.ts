import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  @HostListener('window:pageshow', ['$event'])
  onPageShow(event: PageTransitionEvent): void {
    const currentUrl = this.router.url;
    if (!event.persisted || !currentUrl.startsWith('/admin') || currentUrl.startsWith('/admin/login')) return;
    if (this.auth.hasValidAccessToken()) return;

    this.auth.refreshSession().subscribe({
      next: (restored) => {
        if (!restored) this.redirectToLogin(currentUrl);
      },
      error: () => this.redirectToLogin(currentUrl),
    });
  }

  private redirectToLogin(returnUrl: string): void {
    if (this.router.url !== returnUrl) return;
    void this.router.navigate(['/admin/login'], {
      queryParams: { returnUrl },
      replaceUrl: true,
    });
  }
}
