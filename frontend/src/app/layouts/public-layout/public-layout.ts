import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeControls } from '../../shared/components/theme-controls/theme-controls';

@Component({
  selector: 'app-public-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeControls],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayout {
  readonly year = new Date().getFullYear();
  menuOpen = false;

  closeMenu(): void {
    this.menuOpen = false;
  }
}
