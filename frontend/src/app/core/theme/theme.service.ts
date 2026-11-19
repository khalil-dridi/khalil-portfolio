import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';
export type ThemeAccent = 'red' | 'orange' | 'green' | 'blue' | 'pink';

const ACCENTS: ThemeAccent[] = ['red', 'orange', 'green', 'blue', 'pink'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly mode = signal<ThemeMode>(this.read('portfolio-theme', 'light') as ThemeMode);
  readonly accent = signal<ThemeAccent>(this.readAccent());

  constructor() { this.apply(); }

  toggleMode(): void {
    this.mode.update((mode) => mode === 'light' ? 'dark' : 'light');
    this.apply();
  }

  setAccent(accent: ThemeAccent): void {
    this.accent.set(accent);
    this.document.documentElement.dataset['accent'] = accent;
    this.document.defaultView?.localStorage.setItem('portfolio-accent', accent);
  }

  private apply(): void {
    this.document.documentElement.dataset['theme'] = this.mode();
    this.document.documentElement.dataset['accent'] = this.accent();
    this.document.defaultView?.localStorage.setItem('portfolio-theme', this.mode());
  }

  private read(key: string, fallback: string): string {
    try { return this.document.defaultView?.localStorage.getItem(key) ?? fallback; }
    catch { return fallback; }
  }

  private readAccent(): ThemeAccent {
    const value = this.read('portfolio-accent', 'red');
    return ACCENTS.includes(value as ThemeAccent) ? value as ThemeAccent : 'red';
  }
}
