import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeControls } from '../../../shared/components/theme-controls/theme-controls';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, ThemeControls],
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
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

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
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const target = returnUrl === '/admin' || returnUrl?.startsWith('/admin/') ? returnUrl : '/admin';
        void this.router.navigateByUrl(target, { replaceUrl: true });
      },
      error: (error: unknown) => this.errorMessage.set(AuthService.messageFor(error)),
    });
  }
}
