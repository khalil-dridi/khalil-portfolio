import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Career } from './career';

describe('Career', () => {
  let fixture: ComponentFixture<Career>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Career], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Career);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  it('loads one aggregate response and renders skills, experience and education', () => {
    const request = http.expectOne('/api/career');
    expect(request.request.method).toBe('GET');
    request.flush({
      skills: [{ id: 1, name: 'Spring Boot', category: 'Backend', level: 'Advanced', icon: 'spring', url: 'https://spring.io' }],
      experiences: [{ id: 2, position: 'Engineer', company: 'Example', location: 'Tunis', startDate: '2025-01-01', endDate: '2025-12-31', current: false, description: 'Built APIs', companyWebsite: 'https://example.com' }],
      education: [{ id: 3, institution: 'ENIT', degree: 'Engineering Degree', fieldOfStudy: 'Software', startDate: '2022-09-01', endDate: '2027-06-30', current: true, description: 'Engineering studies', institutionWebsite: 'https://enit.tn' }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Spring Boot');
    expect(fixture.nativeElement.textContent).toContain('Engineer');
    expect(fixture.nativeElement.textContent).toContain('ENIT');
    expect(fixture.nativeElement.textContent).toContain('Present');
    expect(fixture.nativeElement.textContent).not.toContain('Jun 2027');
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.public-skill-card');
    expect(link.href).toBe('https://spring.io/');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
  });

  it('renders empty collections without fictitious career entries', () => {
    http.expectOne('/api/career').flush({ skills: [], experiences: [], education: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('There are no skills to display yet.');
    expect(fixture.nativeElement.textContent).toContain('There are no professional experiences to display yet.');
    expect(fixture.nativeElement.textContent).toContain('There are no education details to display yet.');
    expect(fixture.nativeElement.querySelectorAll('.public-skill-card').length).toBe(0);
  });

  it('displays an error and retries using the aggregate endpoint', () => {
    http.expectOne('/api/career').flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    http.expectOne('/api/career').flush({ skills: [], experiences: [], education: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('There are no skills to display yet.');
  });
});
