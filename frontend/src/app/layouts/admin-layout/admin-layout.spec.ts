import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/theme/theme.service';
import { AuthService } from '../../core/auth/auth.service';
import { of, throwError } from 'rxjs';

import { AdminLayout } from './admin-layout';

describe('AdminLayout', () => {
  let component: AdminLayout;
  let fixture: ComponentFixture<AdminLayout>;
  let router: Router;
  let currentUrl: string;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    currentUrl = '/admin/profile?tab=details';
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    auth.logout.and.returnValue(of(undefined));
    (auth as unknown as { admin: () => null }).admin = () => null;
    await TestBed.configureTestingModule({
      imports: [AdminLayout],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: AuthService, useValue: auth }, ThemeService,
      ],
    })
    .compileComponents();

    router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.callFake(() => currentUrl);
    fixture = TestBed.createComponent(AdminLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('maps known admin routes to titles and ignores query strings and trailing slashes', () => {
    expect(component.pageTitle).toBe('Profile');
    currentUrl = '/admin/projects/';
    expect(component.pageTitle).toBe('Projects');
    currentUrl = '/admin/unknown';
    expect(component.pageTitle).toBe('Administration');
  });

  it('closes the menu and delegates logout to the authentication service', () => {
    component.menuOpen = true;
    component.closeMenu();
    expect(component.menuOpen).toBeFalse();
    component.logout();
    expect(auth.logout).toHaveBeenCalled();
  });

  it('keeps the layout stable if logout returns an error', () => {
    auth.logout.and.returnValue(throwError(() => new Error('network error')));
    expect(() => component.logout()).not.toThrow();
  });
});
