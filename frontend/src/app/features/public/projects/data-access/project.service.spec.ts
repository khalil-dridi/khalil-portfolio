import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProjectService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the public project list without hardcoded host details', () => {
    let received = false;
    service.getProjects().subscribe((projects) => { received = projects.length === 1; });
    const request = http.expectOne('/api/projects');
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 1, title: 'Work', description: 'Description' }]);
    expect(received).toBeTrue();
  });

  it('loads a public project by id', () => {
    let title = '';
    service.getProjectById(12).subscribe((project) => { title = project.title; });
    const request = http.expectOne('/api/projects/12');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 12, title: 'Details', description: 'Description' });
    expect(title).toBe('Details');
  });

  it('uses the protected admin project endpoints for CRUD', () => {
    const body = { title: 'Work', description: 'Details', technologies: null, githubUrl: null };
    let completedRequests = 0;
    service.getAdminProjects().subscribe(() => completedRequests++);
    http.expectOne('/api/admin/projects').flush([]);
    service.getAdminProject(12).subscribe(() => completedRequests++);
    http.expectOne({ method: 'GET', url: '/api/admin/projects/12' }).flush({ id: 12 });
    service.createAdminProject(body).subscribe(() => completedRequests++);
    http.expectOne({ method: 'POST', url: '/api/admin/projects' }).flush({ id: 12 });
    service.updateAdminProject(12, body).subscribe(() => completedRequests++);
    http.expectOne({ method: 'PUT', url: '/api/admin/projects/12' }).flush({ id: 12 });
    service.deleteAdminProject(12).subscribe(() => completedRequests++);
    http.expectOne({ method: 'DELETE', url: '/api/admin/projects/12' }).flush(null);
    expect(completedRequests).toBe(5);
  });

  it('sends image and video uploads as multipart form data without setting Content-Type', () => {
    const file = new File(['test'], 'media.png', { type: 'image/png' });
    service.uploadAdminImage(7, file).subscribe();
    const image = http.expectOne({ method: 'POST', url: '/api/admin/projects/7/image' });
    expect(image.request.body instanceof FormData).toBeTrue();
    expect((image.request.body as FormData).get('file')).toBe(file);
    expect(image.request.headers.has('Content-Type')).toBeFalse();
    image.flush({});
    service.uploadAdminVideo(7, file).subscribe();
    const video = http.expectOne({ method: 'POST', url: '/api/admin/projects/7/video' });
    expect(video.request.body instanceof FormData).toBeTrue();
    expect(video.request.headers.has('Content-Type')).toBeFalse();
    video.flush({});
  });

  it('deletes image and video through their media endpoints', () => {
    let completedRequests = 0;
    service.deleteAdminImage(8).subscribe(() => completedRequests++);
    http.expectOne({ method: 'DELETE', url: '/api/admin/projects/8/image' }).flush(null);
    service.deleteAdminVideo(8).subscribe(() => completedRequests++);
    http.expectOne({ method: 'DELETE', url: '/api/admin/projects/8/video' }).flush(null);
    expect(completedRequests).toBe(2);
  });
});
