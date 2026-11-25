import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { About } from './about';

describe('About', () => {
  let fixture: ComponentFixture<About>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [About],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(About);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('renders the detailed profile and only populated contact fields', () => {
    http.expectOne('/api/profile').flush({
      firstName: 'Grace', lastName: 'Hopper', professionalTitle: 'Computer scientist',
      biography: 'A long professional biography.', email: 'grace@example.test', phone: null,
      location: 'New York', profileImageUrl: '/api/profile/image', resumeUrl: 'https://example.test/resume',
      githubUrl: null, linkedinUrl: 'https://linkedin.com/in/grace', availability: true,
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Grace Hopper');
    expect(text).toContain('Computer scientist');
    expect(text).toContain('A long professional biography.');
    expect(fixture.nativeElement.querySelector('a[href="mailto:grace@example.test"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href^="tel:"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="https://example.test/resume"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="https://linkedin.com/in/grace"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-profile-image img')?.getAttribute('src')).toMatch(/^\/api\/profile\/image\?v=/);
  });

  it('omits empty profile sections and shows a fallback portrait', () => {
    http.expectOne('/api/profile').flush({
      firstName: null, lastName: null, professionalTitle: null, biography: null, email: null,
      phone: null, location: null, profileImageUrl: null, resumeUrl: null, githubUrl: null,
      linkedinUrl: null, availability: false,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.biography-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.details-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('.links-card')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Aucune image de profil disponible"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Non disponible');
  });

  it('shows an accessible error state when the API request fails', () => {
    http.expectOne('/api/profile').flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('introuvables');
  });
});
