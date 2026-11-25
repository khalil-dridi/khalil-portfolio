import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ProfileService } from '../../profile/data-access/profile.service';
import { profileErrorMessage } from '../../profile/data-access/profile-error';
import { PublicProfile } from '../../profile/data-access/profile.models';
import { ProfileImage } from '../../../shared/components/profile-image/profile-image';

@Component({
  selector: 'app-home',
  imports: [ProfileImage],
  templateUrl: './home.html',
})
export class Home {
  private readonly profileService = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  readonly profile = signal<PublicProfile | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly imageVersion = signal<number | null>(null);
  private lastImageVersion = 0;

  constructor() {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.lastImageVersion = Math.max(Date.now(), this.lastImageVersion + 1);
    this.imageVersion.set(this.lastImageVersion);
    this.profileService.getPublicProfile().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (profile) => this.profile.set(profile),
      error: (error: unknown) => this.errorMessage.set(profileErrorMessage(error, 'read')),
    });
  }

  fullName(profile: PublicProfile): string {
    return [profile.firstName, profile.lastName].filter((part) => !!part?.trim()).join(' ');
  }

  imageAlt(profile: PublicProfile): string {
    const name = this.fullName(profile);
    return name ? `Photo de ${name}` : 'Photo de profil';
  }

  onPortraitPointerMove(event: PointerEvent): void {
    if (event.pointerType === 'touch' || this.prefersReducedMotion()) return;
    const target = event.currentTarget as HTMLElement;
    const bounds = target.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    target.style.setProperty('--pointer-x', `${(x - 0.5) * 12}deg`);
    target.style.setProperty('--pointer-y', `${(0.5 - y) * 12}deg`);
    target.style.setProperty('--light-x', `${x * 100}%`);
    target.style.setProperty('--light-y', `${y * 100}%`);
  }

  resetPortraitPointer(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement;
    target.style.removeProperty('--pointer-x');
    target.style.removeProperty('--pointer-y');
    target.style.removeProperty('--light-x');
    target.style.removeProperty('--light-y');
  }

  private prefersReducedMotion(): boolean {
    return this.document?.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
  }
}
