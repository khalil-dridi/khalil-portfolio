import { Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminProfile, ProfileUpdateRequest } from '../../profile/data-access/profile.models';
import { ProfileService } from '../../profile/data-access/profile.service';
import { profileErrorMessage } from '../../profile/data-access/profile-error';
import { optionalHttpUrlValidator } from '../../profile/data-access/profile.validators';
import { ProfileImage } from '../../../shared/components/profile-image/profile-image';

@Component({
  selector: 'app-profile',
  imports: [DatePipe, ReactiveFormsModule, ProfileImage],
  templateUrl: './profile.html',
})
export class Profile implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly profileService = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private previewObjectUrl: string | null = null;
  private lastImageVersion = 0;

  readonly profile = signal<AdminProfile | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly deletingImage = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');
  readonly selectedFile = signal<File | null>(null);
  readonly selectedPreview = signal<string | null>(null);
  readonly imageVersion = signal<number | null>(null);
  readonly completeness = computed(() => {
    const current = this.profile();
    if (!current) return 0;
    const values = [
      current.firstName, current.lastName, current.professionalTitle, current.biography,
      current.email, current.phone, current.location, current.resumeUrl,
      current.githubUrl, current.linkedinUrl, current.profileImageUrl,
    ];
    const complete = values.filter((value) => !!value?.trim()).length;
    return Math.round((complete / values.length) * 100);
  });

  readonly form = this.formBuilder.group({
    firstName: ['', Validators.maxLength(100)],
    lastName: ['', Validators.maxLength(100)],
    professionalTitle: ['', Validators.maxLength(180)],
    biography: ['', Validators.maxLength(10_000)],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    phone: ['', Validators.maxLength(50)],
    location: ['', Validators.maxLength(180)],
    resumeUrl: ['', [Validators.maxLength(2048), optionalHttpUrlValidator()]],
    githubUrl: ['', [Validators.maxLength(2048), optionalHttpUrlValidator()]],
    linkedinUrl: ['', [Validators.maxLength(2048), optionalHttpUrlValidator()]],
    availability: false,
  });

  constructor() {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.profileService.getAdminProfile().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.form.reset(this.formValues(profile));
      },
      error: (error: unknown) => this.loadError.set(profileErrorMessage(error, 'read')),
    });
  }

  submit(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.form.dirty) return;

    this.saving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.profileService.updateProfile(this.buildRequest()).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false)),
    ).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.form.reset(this.formValues(profile));
        this.successMessage.set('Les informations du profil ont été enregistrées.');
      },
      error: (error: unknown) => this.errorMessage.set(profileErrorMessage(error, 'save')),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.successMessage.set('');
    this.errorMessage.set('');
    if (!file) return;

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!acceptedTypes.includes(file.type.toLowerCase())) {
      this.clearSelectedFile(input);
      this.errorMessage.set('Format non pris en charge. Choisissez une image JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.clearSelectedFile(input);
      this.errorMessage.set('Cette image dépasse la limite de 5 Mio.');
      return;
    }

    this.revokePreview();
    this.previewObjectUrl = URL.createObjectURL(file);
    this.selectedFile.set(file);
    this.selectedPreview.set(this.previewObjectUrl);
  }

  uploadImage(input: HTMLInputElement): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;

    this.uploading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.profileService.uploadProfileImage(file).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.uploading.set(false)),
    ).subscribe({
      next: (response) => {
        const current = this.profile();
        if (current) this.profile.set({ ...current, profileImageUrl: response.imageUrl });
        this.lastImageVersion = Math.max(Date.now(), this.lastImageVersion + 1);
        this.imageVersion.set(this.lastImageVersion);
        this.clearSelectedFile(input);
        this.successMessage.set('La photo de profil a été mise à jour.');
      },
      error: (error: unknown) => this.errorMessage.set(profileErrorMessage(error, 'upload')),
    });
  }

  deleteImage(input: HTMLInputElement): void {
    if (!this.profile()?.profileImageUrl || this.deletingImage()) return;

    this.deletingImage.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.profileService.deleteProfileImage().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.deletingImage.set(false)),
    ).subscribe({
      next: () => {
        const current = this.profile();
        if (current) this.profile.set({ ...current, profileImageUrl: null });
        this.imageVersion.set(null);
        this.clearSelectedFile(input);
        this.successMessage.set('La photo de profil a été supprimée.');
      },
      error: (error: unknown) => this.errorMessage.set(profileErrorMessage(error, 'delete')),
    });
  }

  cancelImageSelection(input: HTMLInputElement): void {
    if (this.uploading() || this.deletingImage()) return;
    this.clearSelectedFile(input);
  }

  fullName(profile: AdminProfile): string {
    return [profile.firstName, profile.lastName].filter((part) => !!part?.trim()).join(' ');
  }

  private formValues(profile: AdminProfile) {
    return {
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      professionalTitle: profile.professionalTitle ?? '',
      biography: profile.biography ?? '',
      email: profile.email ?? '',
      phone: profile.phone ?? '',
      location: profile.location ?? '',
      resumeUrl: profile.resumeUrl ?? '',
      githubUrl: profile.githubUrl ?? '',
      linkedinUrl: profile.linkedinUrl ?? '',
      availability: profile.availability,
    };
  }

  private buildRequest(): ProfileUpdateRequest {
    const values = this.form.getRawValue();
    return {
      firstName: this.form.controls.firstName.dirty ? values.firstName : null,
      lastName: this.form.controls.lastName.dirty ? values.lastName : null,
      professionalTitle: this.form.controls.professionalTitle.dirty ? values.professionalTitle : null,
      biography: this.form.controls.biography.dirty ? values.biography : null,
      email: this.form.controls.email.dirty ? values.email : null,
      phone: this.form.controls.phone.dirty ? values.phone : null,
      location: this.form.controls.location.dirty ? values.location : null,
      resumeUrl: this.form.controls.resumeUrl.dirty ? values.resumeUrl : null,
      githubUrl: this.form.controls.githubUrl.dirty ? values.githubUrl : null,
      linkedinUrl: this.form.controls.linkedinUrl.dirty ? values.linkedinUrl : null,
      availability: this.form.controls.availability.dirty ? values.availability : null,
    };
  }

  private clearSelectedFile(input: HTMLInputElement): void {
    this.revokePreview();
    this.selectedFile.set(null);
    this.selectedPreview.set(null);
    input.value = '';
  }

  private revokePreview(): void {
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
  }
}
