import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('loads and renders the dynamic public hero, CV and social links', () => {
    expect(fixture.nativeElement.textContent).toContain('Chargement du profil');
    http.expectOne('/api/profile').flush({
      firstName: 'Ada', lastName: 'Lovelace', professionalTitle: 'Software engineer',
      biography: 'Builds thoughtful software.', email: 'ada@example.test', phone: null,
      location: 'London', profileImageUrl: '/api/profile/image', resumeUrl: 'https://example.test/cv.pdf',
      githubUrl: 'https://github.com/ada', linkedinUrl: 'https://linkedin.com/in/ada', availability: true,
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ada Lovelace');
    expect(text).toContain('Software engineer');
    expect(text).toContain('Disponible pour de nouvelles opportunités');
    expect(fixture.nativeElement.querySelector('a[href="https://example.test/cv.pdf"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="https://github.com/ada"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="https://linkedin.com/in/ada"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-profile-image img')?.getAttribute('src')).toMatch(/^\/api\/profile\/image\?v=/);
  });

  it('gracefully renders empty fields and the missing-image fallback', () => {
    http.expectOne('/api/profile').flush({
      firstName: null, lastName: null, professionalTitle: null, biography: null, email: null,
      phone: null, location: null, profileImageUrl: null, resumeUrl: null, githubUrl: null,
      linkedinUrl: null, availability: false,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Non disponible actuellement');
    expect(fixture.nativeElement.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href^="https://github.com"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Aucune image de profil disponible"]')).not.toBeNull();
  });

  it('shows a friendly API error and can retry', () => {
    http.expectOne('/api/profile').flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Impossible de charger');

    fixture.componentInstance.loadProfile();
    http.expectOne('/api/profile').flush({
      firstName: 'Ada', lastName: null, professionalTitle: null, biography: null, email: null,
      phone: null, location: null, profileImageUrl: null, resumeUrl: null, githubUrl: null,
      linkedinUrl: null, availability: false,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ada');
  });
});
