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

  it('loads all career data once and shows exactly the selected interface', () => {
    const request = http.expectOne('/api/career');
    expect(request.request.method).toBe('GET');
    request.flush({
      skills: [{ id: 1, name: 'Spring Boot', category: 'Backend', level: 'Advanced', icon: 'spring', url: 'https://spring.io' }],
      experiences: [{ id: 2, position: 'Engineer', company: 'Example', location: 'Tunis', startDate: '2025-01-01', endDate: '2025-12-31', current: false, description: 'Built APIs', companyWebsite: 'https://example.com' }],
      education: [{ id: 3, institution: 'ENIT', degree: 'Engineering Degree', fieldOfStudy: 'Software', startDate: '2022-09-01', endDate: '2027-06-30', current: true, description: 'Engineering studies', institutionWebsite: 'https://enit.tn' }],
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Spring Boot');
    expect(fixture.nativeElement.querySelector('#skills-title')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#experience-title')).toBeNull();
    expect(fixture.nativeElement.querySelector('#education-title')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[role="tabpanel"]').length).toBe(1);
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.technology-link');
    expect(link.href).toBe('https://spring.io/');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');

    (fixture.nativeElement.querySelector('#career-tab-experience') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Engineer');
    expect(fixture.nativeElement.querySelector('#experience-title')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#skills-title')).toBeNull();
    expect(fixture.nativeElement.querySelector('.technology-card')).toBeNull();

    (fixture.nativeElement.querySelector('#career-tab-education') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ENIT');
    expect(fixture.nativeElement.querySelector('#education-title')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#experience-title')).toBeNull();

    (fixture.nativeElement.querySelector('#career-tab-skills') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#skills-title')).toBeTruthy();
    http.expectNone('/api/career');
  });

  it('renders empty collections without fictitious career entries', () => {
    http.expectOne('/api/career').flush({ skills: [], experiences: [], education: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('There are no skills to display yet.');
    expect(fixture.nativeElement.querySelectorAll('.technology-card').length).toBe(0);

    (fixture.nativeElement.querySelector('#career-tab-experience') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('There are no professional experiences to display yet.');
    expect(fixture.nativeElement.textContent).not.toContain('There are no skills to display yet.');

    (fixture.nativeElement.querySelector('#career-tab-education') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('There are no education details to display yet.');
    expect(fixture.nativeElement.textContent).not.toContain('There are no professional experiences to display yet.');
  });

  it('updates the active tab without requesting data again', () => {
    http.expectOne('/api/career').flush({ skills: [], experiences: [], education: [] });
    fixture.detectChanges();
    const link: HTMLButtonElement = fixture.nativeElement.querySelector('#career-tab-experience');
    link.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('experience');
    expect(link.getAttribute('aria-selected')).toBe('true');
    expect(fixture.nativeElement.querySelectorAll('[role="tabpanel"]').length).toBe(1);
    http.expectNone('/api/career');
  });

  it('displays an error and retries using the aggregate endpoint', () => {
    http.expectOne('/api/career').flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    fixture.nativeElement.querySelector('.career-error button').click();
    fixture.detectChanges();
    http.expectOne('/api/career').flush({ skills: [], experiences: [], education: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('There are no skills to display yet.');
  });
});
