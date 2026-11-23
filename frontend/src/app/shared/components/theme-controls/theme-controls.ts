import { Component, inject } from '@angular/core';
import { ThemeAccent, ThemeService } from '../../../core/theme/theme.service';

@Component({
  selector: 'app-theme-controls',
  templateUrl: './theme-controls.html',
  styleUrl: './theme-controls.scss',
})
export class ThemeControls {
  readonly theme = inject(ThemeService);
  readonly accents: { id: ThemeAccent; label: string }[] = [
    { id: 'red', label: 'Rouge' },
    { id: 'orange', label: 'Orange' },
    { id: 'green', label: 'Vert' },
    { id: 'blue', label: 'Bleu' },
    { id: 'pink', label: 'Rose' },
  ];
}
