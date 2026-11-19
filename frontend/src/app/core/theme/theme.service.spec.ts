import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem('portfolio-theme');
    localStorage.removeItem('portfolio-accent');
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-accent');
    TestBed.configureTestingModule({ providers: [ThemeService] });
  });

  it('starts in light mode and switches to dark mode', () => {
    const theme = TestBed.inject(ThemeService);
    expect(theme.mode()).toBe('light');
    theme.toggleMode();
    expect(theme.mode()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('applies and persists the selected accent', () => {
    const theme = TestBed.inject(ThemeService);
    theme.setAccent('blue');
    expect(document.documentElement.dataset['accent']).toBe('blue');
    expect(localStorage.getItem('portfolio-accent')).toBe('blue');
  });

  it('restores saved preferences after service recreation', () => {
    localStorage.setItem('portfolio-theme', 'dark');
    localStorage.setItem('portfolio-accent', 'green');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [ThemeService] });
    const theme = TestBed.inject(ThemeService);
    expect(theme.mode()).toBe('dark');
    expect(theme.accent()).toBe('green');
  });
});
