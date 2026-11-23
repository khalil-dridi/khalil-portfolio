import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ProfileService } from '../../profile/data-access/profile.service';
import { profileErrorMessage } from '../../profile/data-access/profile-error';
import { PublicProfile } from '../../profile/data-access/profile.models';
import { ProfileImage } from '../../../shared/components/profile-image/profile-image';

@Component({
  selector: 'app-home',
  imports: [ProfileImage, RouterLink],
  templateUrl: './home.html',
})
export class Home {
  private readonly profileService = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);
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
}
