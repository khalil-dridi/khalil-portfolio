import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeAccent, ThemeService } from '../../../core/theme/theme.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly formBuilder = new FormBuilder();
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
  readonly passwordVisible = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly accents: { id: ThemeAccent; label: string }[] = [
    { id: 'red', label: 'Rouge' }, { id: 'orange', label: 'Orange' },
    { id: 'green', label: 'Vert' }, { id: 'blue', label: 'Bleu' }, { id: 'pink', label: 'Rose' },
  ];

  constructor(readonly theme: ThemeService, private readonly auth: AuthService, private readonly router: Router) {}

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set('');
    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => void this.router.navigate(['/admin']),
      error: (error: unknown) => this.errorMessage.set(AuthService.messageFor(error)),
    });
  }
}
