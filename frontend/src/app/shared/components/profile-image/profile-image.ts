import { Component, computed, effect, input, signal } from '@angular/core';

@Component({
  selector: 'app-profile-image',
  templateUrl: './profile-image.html',
  styleUrl: './profile-image.scss',
})
export class ProfileImage {
  readonly imageUrl = input<string | null>(null);
  readonly alt = input('Photo de profil');
  readonly cacheVersion = input<number | null>(null);
  readonly loaded = signal(false);
  readonly failed = signal(false);
  readonly src = computed(() => {
    const url = this.imageUrl();
    const version = this.cacheVersion();
    if (!url || version === null) return url;
    return `${url}${url.includes('?') ? '&' : '?'}v=${version}`;
  });

  constructor() {
    effect(() => {
      this.src();
      this.loaded.set(false);
      this.failed.set(false);
    });
  }

  markLoaded(): void {
    this.loaded.set(true);
  }

  markFailed(): void {
    this.failed.set(true);
    this.loaded.set(true);
  }
}
