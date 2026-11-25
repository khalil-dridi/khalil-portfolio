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

  it('shows loading, then renders the project card without technology badges', () => {
    expect(fixture.componentInstance.loading()).toBeTrue();
    const request = http.expectOne('/api/projects');
    expect(request.request.method).toBe('GET');
    request.flush([project]);
    fixture.detectChanges();

    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain('Portfolio API');
    expect(fixture.nativeElement.querySelectorAll('.project-card .technology-list li').length).toBe(0);
    expect(fixture.nativeElement.querySelector('.cover-fallback')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.project-actions button').length).toBe(3);
  });

  it('navigates the carousel with arrows, keyboard and pagination and wraps around', () => {
    http.expectOne('/api/projects').flush([
      project,
      { ...project, id: 8, title: 'Project Two' },
      { ...project, id: 9, title: 'Project Three' },
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.position(0)).toBe('active');
    expect(fixture.componentInstance.position(1)).toBe('next');
    expect(fixture.componentInstance.position(2)).toBe('previous');
    fixture.nativeElement.querySelector('.next-arrow').click();
    expect(fixture.componentInstance.activeIndex()).toBe(1);

    fixture.nativeElement.querySelector('.project-carousel').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(fixture.componentInstance.activeIndex()).toBe(2);
    fixture.nativeElement.querySelectorAll('.carousel-pagination button')[0].click();
    expect(fixture.componentInstance.activeIndex()).toBe(0);
    fixture.nativeElement.querySelector('.previous-arrow').click();
    expect(fixture.componentInstance.activeIndex()).toBe(2);
  });

  it('keeps carousel navigation valid with one or two projects', () => {
    http.expectOne('/api/projects').flush([project, { ...project, id: 8, title: 'Project Two' }]);
    fixture.detectChanges();
    expect(fixture.componentInstance.position(0)).toBe('active');
    expect(fixture.componentInstance.position(1)).toBe('next');
    fixture.componentInstance.next();
    expect(fixture.componentInstance.activeIndex()).toBe(1);
    fixture.componentInstance.next();
    expect(fixture.componentInstance.activeIndex()).toBe(0);

    fixture.componentInstance.projects.set([project]);
    fixture.componentInstance.next();
    expect(fixture.componentInstance.activeIndex()).toBe(0);
    expect(fixture.componentInstance.position(0)).toBe('active');
  });

  it('keeps cards stable on mouse movement and lays actions out with wrapping flexbox', () => {
    http.expectOne('/api/projects').flush([project, { ...project, id: 8, title: 'Project Two' }]);
    fixture.detectChanges();
    const card: HTMLElement = fixture.nativeElement.querySelector('.project-card.is-active');
    const before = getComputedStyle(card).transform;
    fixture.nativeElement.querySelector('.project-carousel').dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true, clientX: 600, clientY: 240,
    }));
    expect(getComputedStyle(card).transform).toBe(before);

    const actions: HTMLElement = fixture.nativeElement.querySelector('.project-card.is-active .project-actions');
    expect(getComputedStyle(actions).display).toBe('flex');
    expect(getComputedStyle(actions).flexWrap).toBe('wrap');
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.project-card.is-active .project-actions button')) as HTMLElement[];
    expect(buttons.length).toBe(3);
    for (const button of buttons) {
      expect(getComputedStyle(button).position).toBe('static');
      expect(getComputedStyle(button).minHeight).toBe('42px');
    }
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
    expect(Array.from(fixture.nativeElement.querySelectorAll('.detail-technologies li')).map((node: any) => node.textContent.trim()))
      .toEqual(['Angular', 'Spring Boot', 'MySQL']);
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
