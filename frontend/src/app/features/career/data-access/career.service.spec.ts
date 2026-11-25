import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CareerService } from './career.service';

describe('CareerService', () => {
  let service: CareerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CareerService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads all public Career collections from the single aggregate endpoint', () => {
    let result: unknown;
    service.getCareer().subscribe((value) => result = value);
    const request = http.expectOne('/api/career');
    expect(request.request.method).toBe('GET');
    request.flush({ skills: [], experiences: [], education: [] });
    expect(result).toEqual({ skills: [], experiences: [], education: [] });
  });

  it('uses the Skills administration routes and sends complete request bodies', () => {
    const body = { name: 'Spring Boot', category: 'Backend', level: 'Advanced', icon: 'spring', url: 'https://spring.io' };
    service.getSkills().subscribe(); http.expectOne({ method: 'GET', url: '/api/admin/career/skills' }).flush([]);
    service.getSkill(2).subscribe(); http.expectOne({ method: 'GET', url: '/api/admin/career/skills/2' }).flush({ id: 2, ...body });
    service.createSkill(body).subscribe(); http.expectOne({ method: 'POST', url: '/api/admin/career/skills' }).flush({ id: 2, ...body });
    service.updateSkill(2, body).subscribe();
    const update = http.expectOne({ method: 'PUT', url: '/api/admin/career/skills/2' });
    expect(update.request.body).toEqual(body);
    update.flush({ id: 2, ...body });
    service.deleteSkill(2).subscribe(); http.expectOne({ method: 'DELETE', url: '/api/admin/career/skills/2' }).flush(null);
  });

  it('uses the Experience administration routes and preserves all fields on update', () => {
    const body = { position: 'Engineer', company: 'Example', location: 'Tunis', startDate: '2025-01-01', endDate: '2025-12-31', current: false, description: 'Built services', companyWebsite: 'https://example.com' };
    service.getExperiences().subscribe(); http.expectOne({ method: 'GET', url: '/api/admin/career/experiences' }).flush([]);
    service.getExperience(3).subscribe(); http.expectOne({ method: 'GET', url: '/api/admin/career/experiences/3' }).flush({ id: 3, ...body });
    service.createExperience(body).subscribe(); http.expectOne({ method: 'POST', url: '/api/admin/career/experiences' }).flush({ id: 3, ...body });
    service.updateExperience(3, body).subscribe();
    const update = http.expectOne({ method: 'PUT', url: '/api/admin/career/experiences/3' });
    expect(update.request.body).toEqual(body);
    update.flush({ id: 3, ...body });
    service.deleteExperience(3).subscribe(); http.expectOne({ method: 'DELETE', url: '/api/admin/career/experiences/3' }).flush(null);
  });

  it('uses the Education administration routes and preserves all fields on update', () => {
    const body = { institution: 'ENIT', degree: 'Engineering', fieldOfStudy: 'Software', startDate: '2022-09-01', endDate: '2027-06-30', current: true, description: 'Studies', institutionWebsite: 'https://enit.tn' };
    service.getEducation().subscribe(); http.expectOne({ method: 'GET', url: '/api/admin/career/education' }).flush([]);
    service.getEducationItem(4).subscribe(); http.expectOne({ method: 'GET', url: '/api/admin/career/education/4' }).flush({ id: 4, ...body });
    service.createEducation(body).subscribe(); http.expectOne({ method: 'POST', url: '/api/admin/career/education' }).flush({ id: 4, ...body });
    service.updateEducation(4, body).subscribe();
    const update = http.expectOne({ method: 'PUT', url: '/api/admin/career/education/4' });
    expect(update.request.body).toEqual(body);
    update.flush({ id: 4, ...body });
    service.deleteEducation(4).subscribe(); http.expectOne({ method: 'DELETE', url: '/api/admin/career/education/4' }).flush(null);
  });
});
