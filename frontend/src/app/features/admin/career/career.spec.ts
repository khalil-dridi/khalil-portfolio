import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CareerService } from '../../career/data-access/career.service';
import { AdminCareer } from './career';

describe('AdminCareer', () => {
  let fixture: ComponentFixture<AdminCareer>;
  let api: jasmine.SpyObj<CareerService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<CareerService>('CareerService', [
      'getSkills', 'getExperiences', 'getEducation', 'createSkill', 'updateSkill', 'deleteSkill',
      'createExperience', 'updateExperience', 'deleteExperience', 'createEducation', 'updateEducation', 'deleteEducation',
    ]);
    api.getSkills.and.returnValue(of([]));
    api.getExperiences.and.returnValue(of([]));
    api.getEducation.and.returnValue(of([]));
    api.createSkill.and.returnValue(of({ id: 1, name: 'Spring Boot', category: 'Backend', level: 'Advanced', icon: 'spring', url: 'https://spring.io' }));
    api.updateSkill.and.returnValue(of({ id: 1, name: 'Spring Boot', category: 'Backend', level: 'Expert', icon: 'spring', url: 'https://spring.io' }));
    api.deleteSkill.and.returnValue(of(void 0));
    api.createExperience.and.returnValue(of({ id: 2, position: 'Engineer', company: 'Example', location: 'Tunis', startDate: '2025-01-01', endDate: '2025-12-31', current: true, description: 'Built APIs', companyWebsite: 'https://example.com' }));
    api.updateExperience.and.returnValue(of({ id: 2, position: 'Engineer', company: 'Example', location: 'Tunis', startDate: '2025-01-01', endDate: '2025-12-31', current: true, description: 'Built APIs', companyWebsite: 'https://example.com' }));
    api.deleteExperience.and.returnValue(of(void 0));
    api.createEducation.and.returnValue(of({ id: 3, institution: 'ENIT', degree: 'Engineering', fieldOfStudy: 'Software', startDate: '2022-09-01', endDate: '2027-06-30', current: true, description: 'Studies', institutionWebsite: 'https://enit.tn' }));
    api.updateEducation.and.returnValue(of({ id: 3, institution: 'ENIT', degree: 'Engineering', fieldOfStudy: 'Software', startDate: '2022-09-01', endDate: '2027-06-30', current: true, description: 'Studies', institutionWebsite: 'https://enit.tn' }));
    api.deleteEducation.and.returnValue(of(void 0));
    await TestBed.configureTestingModule({ imports: [AdminCareer], providers: [provideRouter([]), { provide: CareerService, useValue: api }] }).compileComponents();
    fixture = TestBed.createComponent(AdminCareer);
    fixture.detectChanges();
  });

  it('loads the three admin lists and shows an empty state without fake data', () => {
    expect(api.getSkills).toHaveBeenCalled();
    expect(api.getExperiences).toHaveBeenCalled();
    expect(api.getEducation).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('No skills yet');
  });

  it('accepts an empty Skills form and sends the complete trimmed create request', () => {
    const component = fixture.componentInstance;
    component.openCreate();
    fixture.detectChanges();
    const createButton: HTMLButtonElement = fixture.nativeElement.querySelector('.career-dialog-actions button[type="submit"]');
    expect(createButton.disabled).toBeFalse();
    createButton.click();
    fixture.detectChanges();
    expect(component.skillForm.valid).toBeTrue();
    expect(api.createSkill).toHaveBeenCalledWith({ name: '', category: '', level: '', icon: '', url: '' });
    component.openCreate();
    component.skillForm.setValue({ name: ' Spring Boot ', category: ' Backend ', level: 'Advanced', icon: 'spring', url: 'https://spring.io/projects/spring-boot' });
    expect(component.skillForm.valid).toBeTrue();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.career-dialog-actions button[type="submit"]') as HTMLButtonElement).click();
    expect(api.createSkill).toHaveBeenCalledWith({ name: 'Spring Boot', category: 'Backend', level: 'Advanced', icon: 'spring', url: 'https://spring.io/projects/spring-boot' });
    expect(component.editorOpen()).toBeFalse();
    expect(component.skills().length).toBe(1);
    expect(component.successMessage()).toContain('created');
  });

  it('sends a full PUT payload for editing a skill', () => {
    const component = fixture.componentInstance;
    component.openSkillEdit({ id: 1, name: 'Spring Boot', category: 'Backend', level: 'Advanced', icon: 'spring', url: 'https://spring.io' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.career-icon-choice-copy strong').textContent.trim()).toBe('Spring / Spring Boot');
    component.skillForm.controls.level.setValue('Expert');
    (fixture.nativeElement.querySelector('.career-dialog-actions button[type="submit"]') as HTMLButtonElement).click();
    expect(api.updateSkill).toHaveBeenCalledWith(1, { name: 'Spring Boot', category: 'Backend', level: 'Expert', icon: 'spring', url: 'https://spring.io' });
  });

  it('creates a skill from a technology selected in the icon picker', () => {
    const component = fixture.componentInstance;
    component.openCreate();
    component.skillForm.patchValue({ name: 'Angular', category: 'Frontend', level: 'Advanced', url: 'https://angular.dev' });
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.career-icon-choice') as HTMLButtonElement).click();
    fixture.detectChanges();
    const search: HTMLInputElement = fixture.nativeElement.querySelector('.picker-search input');
    search.value = 'Angular';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[aria-label="Select Angular"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.picker-confirm') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.skillForm.controls.icon.value).toBe('angular');
    (fixture.nativeElement.querySelector('.career-dialog-actions button[type="submit"]') as HTMLButtonElement).click();
    expect(api.createSkill).toHaveBeenCalledWith({ name: 'Angular', category: 'Frontend', level: 'Advanced', icon: 'angular', url: 'https://angular.dev' });
  });

  it('requires valid experience dates and always sends an expected end date for current roles', () => {
    const component = fixture.componentInstance;
    component.activeTab.set('experience');
    component.openCreate();
    fixture.detectChanges();
    component.experienceForm.setValue({ position: 'Engineer', company: 'Example', location: 'Tunis', startDate: '2025-10-01', endDate: '2025-01-01', current: true, description: 'Built APIs', companyWebsite: 'https://example.com' });
    (fixture.nativeElement.querySelector('.career-dialog-actions button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(api.createExperience).not.toHaveBeenCalled();
    expect(component.experienceForm.valid).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('End date must be on or after');
    fixture.detectChanges();
    component.experienceForm.controls.endDate.setValue('2026-01-01');
    (fixture.nativeElement.querySelector('.career-dialog-actions button[type="submit"]') as HTMLButtonElement).click();
    expect(api.createExperience).toHaveBeenCalledWith({ position: 'Engineer', company: 'Example', location: 'Tunis', startDate: '2025-10-01', endDate: '2026-01-01', current: true, description: 'Built APIs', companyWebsite: 'https://example.com' });
  });

  it('accepts empty and partially completed Experience forms', () => {
    const component = fixture.componentInstance;
    component.activeTab.set('experience');
    component.openCreate();
    component.save();
    expect(api.createExperience).toHaveBeenCalledWith({ position: '', company: '', location: '', startDate: null, endDate: null, current: false, description: '', companyWebsite: '' });

    component.openCreate();
    component.experienceForm.controls.position.setValue('Developer');
    component.save();
    expect(api.createExperience).toHaveBeenCalledWith({ position: 'Developer', company: '', location: '', startDate: null, endDate: null, current: false, description: '', companyWebsite: '' });
  });

  it('sends all Education fields and ISO dates when creating a current program', () => {
    const component = fixture.componentInstance;
    component.activeTab.set('education');
    component.openCreate();
    fixture.detectChanges();
    component.educationForm.setValue({ institution: 'ENIT', degree: 'Engineering Degree', fieldOfStudy: 'Software Engineering', startDate: '2022-09-01', endDate: '2027-06-30', current: true, description: 'Engineering studies.', institutionWebsite: 'https://www.enit.rnu.tn' });
    expect(component.educationForm.valid).toBeTrue();
    (fixture.nativeElement.querySelector('.career-dialog-actions button[type="submit"]') as HTMLButtonElement).click();
    expect(api.createEducation).toHaveBeenCalledWith({ institution: 'ENIT', degree: 'Engineering Degree', fieldOfStudy: 'Software Engineering', startDate: '2022-09-01', endDate: '2027-06-30', current: true, description: 'Engineering studies.', institutionWebsite: 'https://www.enit.rnu.tn' });
    expect(component.education()[0].endDate).toBe('2027-06-30');
  });

  it('accepts empty and partially completed Education forms', () => {
    const component = fixture.componentInstance;
    component.activeTab.set('education');
    component.openCreate();
    component.save();
    expect(api.createEducation).toHaveBeenCalledWith({ institution: '', degree: '', fieldOfStudy: '', startDate: null, endDate: null, current: false, description: '', institutionWebsite: '' });

    component.openCreate();
    component.educationForm.controls.degree.setValue('BSc');
    component.save();
    expect(api.createEducation).toHaveBeenCalledWith({ institution: '', degree: 'BSc', fieldOfStudy: '', startDate: null, endDate: null, current: false, description: '', institutionWebsite: '' });
  });

  it('sends a complete PUT request when editing Experience and Education', () => {
    const component = fixture.componentInstance;
    component.activeTab.set('experience');
    component.openExperienceEdit({ id: 2, position: 'Engineer', company: 'Example', location: 'Tunis', startDate: '2025-01-01', endDate: '2025-12-31', current: true, description: 'Built APIs', companyWebsite: 'https://example.com' });
    fixture.detectChanges();
    component.experienceForm.controls.position.setValue('Senior Engineer');
    (fixture.nativeElement.querySelector('.career-dialog-actions button[type="submit"]') as HTMLButtonElement).click();
    expect(api.updateExperience).toHaveBeenCalledWith(2, { position: 'Senior Engineer', company: 'Example', location: 'Tunis', startDate: '2025-01-01', endDate: '2025-12-31', current: true, description: 'Built APIs', companyWebsite: 'https://example.com' });

    component.activeTab.set('education');
    component.openEducationEdit({ id: 3, institution: 'ENIT', degree: 'Engineering', fieldOfStudy: 'Software', startDate: '2022-09-01', endDate: '2027-06-30', current: true, description: 'Studies', institutionWebsite: 'https://enit.tn' });
    fixture.detectChanges();
    component.educationForm.controls.degree.setValue('Engineering Degree');
    (fixture.nativeElement.querySelector('.career-dialog-actions button[type="submit"]') as HTMLButtonElement).click();
    expect(api.updateEducation).toHaveBeenCalledWith(3, { institution: 'ENIT', degree: 'Engineering Degree', fieldOfStudy: 'Software', startDate: '2022-09-01', endDate: '2027-06-30', current: true, description: 'Studies', institutionWebsite: 'https://enit.tn' });
  });

  it('confirms deletion before calling the selected CRUD endpoint', () => {
    const component = fixture.componentInstance;
    component.skills.set([{ id: 8, name: 'Docker', category: 'DevOps', level: 'Intermediate', icon: 'docker', url: 'https://docker.com' }]);
    fixture.detectChanges();
    component.askDelete('skills', component.skills()[0]);
    fixture.detectChanges();
    expect(api.deleteSkill).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Docker');
    component.confirmDelete();
    expect(api.deleteSkill).toHaveBeenCalledWith(8);
    expect(component.skills()).toEqual([]);
  });
});
