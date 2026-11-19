import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['hasValidAccessToken', 'refreshSession']);
    auth.hasValidAccessToken.and.returnValue(true);
    auth.refreshSession.and.returnValue(of(true));
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: AuthService, useValue: auth }, provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the application router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('revalidates a protected route restored from the back-forward cache', () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOnProperty(router, 'url', 'get').and.returnValue('/admin/projects');
    const auth = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    auth.hasValidAccessToken.and.returnValue(false);
    auth.refreshSession.and.returnValue(of(false));

    fixture.componentInstance.onPageShow({ persisted: true } as PageTransitionEvent);

    expect(auth.refreshSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login'], {
      queryParams: { returnUrl: '/admin/projects' },
      replaceUrl: true,
    });
  });
});
