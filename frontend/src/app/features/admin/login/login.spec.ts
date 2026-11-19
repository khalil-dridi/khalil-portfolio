import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: auth },
        provideRouter([]),
        ThemeService,
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates with an invalid form', () => {
    expect(component).toBeTruthy();
    expect(component.form.invalid).toBeTrue();
  });

  it('validates email and required fields', () => {
    component.form.controls.email.setValue('not-an-email');
    component.form.controls.password.setValue('secret');
    expect(component.form.controls.email.hasError('email')).toBeTrue();
    component.form.controls.email.setValue('admin@example.com');
    component.form.controls.password.setValue('');
    expect(component.form.controls.password.hasError('required')).toBeTrue();
  });

  it('shows and hides the password', () => {
    const input = fixture.nativeElement.querySelector('input[formControlName="password"]') as HTMLInputElement;
    expect(input.type).toBe('password');
    component.togglePasswordVisibility();
    fixture.detectChanges();
    expect(input.type).toBe('text');
  });

  it('does not submit an invalid form', () => {
    component.submit();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('redirects to the admin dashboard after successful authentication', () => {
    auth.login.and.returnValue(of({
      accessToken: 'memory-token',
      tokenType: 'Bearer',
      expiresIn: 60,
      admin: { id: 1, email: 'admin@example.com', lastLoginAt: null },
    }));
    component.form.setValue({ email: 'admin@example.com', password: 'secret' });
    component.submit();
    expect(auth.login).toHaveBeenCalledWith({ email: 'admin@example.com', password: 'secret' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin', { replaceUrl: true });
  });

  it('reports invalid credentials and network failures in French', () => {
    component.form.setValue({ email: 'admin@example.com', password: 'wrong' });
    auth.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    component.submit();
    expect(component.errorMessage()).toContain('incorrect');
    auth.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    component.submit();
    expect(component.errorMessage()).toContain('serveur');
  });

  it('disables the submit button while the request is pending', () => {
    auth.login.and.returnValue(new Observable(() => undefined));
    component.form.setValue({ email: 'admin@example.com', password: 'secret' });
    component.submit();
    fixture.detectChanges();
    expect(component.loading()).toBeTrue();
    expect((fixture.nativeElement.querySelector('.submit-button') as HTMLButtonElement).disabled).toBeTrue();
  });
});
