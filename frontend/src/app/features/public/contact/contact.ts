import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../profile/data-access/profile.service';
import { PublicProfile } from '../../profile/data-access/profile.models';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.html',
})
export class Contact {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  readonly profile = signal<PublicProfile | null>(null);
  readonly loading = signal(true);
  readonly profileError = signal(false);
  readonly emailLaunched = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    subject: ['', [Validators.required, Validators.maxLength(180)]],
    message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(5000)]],
  });

  constructor() {
    this.profileService.getPublicProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (profile) => { this.profile.set(profile); this.loading.set(false); },
      error: () => { this.profileError.set(true); this.loading.set(false); },
    });
  }

  sendMessage(): void {
    this.emailLaunched.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const recipient = this.profile()?.email?.trim();
    if (!recipient) {
      this.profileError.set(true);
      return;
    }

    const { name, email, subject, message } = this.form.getRawValue();
    const body = `${message.trim()}\n\n— ${name.trim()}\n${email.trim()}`;
    const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body)}`;
    const view = this.document.defaultView;
    if (view) {
      view.location.href = mailto;
      this.emailLaunched.set(true);
    }
  }

  fieldInvalid(name: 'name' | 'email' | 'subject' | 'message'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }
}
