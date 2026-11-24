import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Project } from './data-access/project.models';
import { Projects } from './projects';

describe('Projects', () => {
  let fixture: ComponentFixture<Projects>;
  let http: HttpTestingController;

  const project: Project = {
    id: 7,
    title: 'Portfolio API',
    description: 'A complete project description for the portfolio API.',
    technologies: 'Angular, Spring Boot, MySQL',
    backgroundImageUrl: null,
    demoVideoUrl: '/api/projects/7/video',
    githubUrl: 'https://github.com/example/portfolio-api',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Projects],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Projects);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('shows loading while requesting projects, then renders project details and technology badges', () => {
    expect(fixture.componentInstance.loading()).toBeTrue();
    const request = http.expectOne('/api/projects');
    expect(request.request.method).toBe('GET');
    request.flush([project]);
    fixture.detectChanges();

    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Portfolio API');
    expect(Array.from(fixture.nativeElement.querySelectorAll('.technology-list li')).map((node: any) => node.textContent.trim()))
      .toEqual(['Angular', 'Spring Boot', 'MySQL']);
    expect(fixture.nativeElement.querySelector('.cover-fallback')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.project-actions button').length).toBe(3);
  });

  it('shows a useful empty state when the API returns no projects', () => {
    http.expectOne('/api/projects').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Good things are in progress');
  });

  it('shows an error and retries the public projects request', () => {
    http.expectOne('/api/projects').flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Projects couldn’t load');

    fixture.nativeElement.querySelector('.state-card button').click();
    fixture.detectChanges();
    http.expectOne('/api/projects').flush([project]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Portfolio API');
  });

  it('opens the demo, repository and details dialogs and closes them accessibly', () => {
    http.expectOne('/api/projects').flush([project]);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.project-actions button');
    const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');

    buttons[0].click();
    fixture.detectChanges();
    expect(dialog.open).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('PROJECT DEMO');
    expect(fixture.nativeElement.querySelector('video')?.getAttribute('src')).toBe('/api/projects/7/video');
    fixture.nativeElement.querySelector('.modal-close').click();
    fixture.detectChanges();

    buttons[1].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Open GitHub Repository');
    const repositoryLink: HTMLAnchorElement = fixture.nativeElement.querySelector('.github-open');
    expect(repositoryLink.href).toBe(project.githubUrl!);
    expect(repositoryLink.target).toBe('_blank');
    expect(repositoryLink.rel).toContain('noopener');
    fixture.nativeElement.querySelector('.modal-close').click();
    fixture.detectChanges();

    buttons[2].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(project.description);
    fixture.nativeElement.querySelector('.modal-close').click();
    fixture.detectChanges();
    expect(dialog.open).toBeFalse();
  });

  it('shows unavailable states for missing demo and repository links', () => {
    http.expectOne('/api/projects').flush([{ ...project, demoVideoUrl: null, githubUrl: null }]);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.project-actions button');
    buttons[0].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No demo available yet');
    fixture.nativeElement.querySelector('.modal-close').click();
    fixture.detectChanges();
    buttons[1].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Repository link not available');
    expect(fixture.nativeElement.querySelector('.github-open')).toBeNull();
  });
});
