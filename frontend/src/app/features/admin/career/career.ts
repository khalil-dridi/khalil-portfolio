import { HttpErrorResponse } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CareerService } from '../../career/data-access/career.service';
import { Education, Experience, Skill } from '../../career/data-access/career.models';
import { TechnologyIconPicker } from '../../../shared/technology-icon-picker/technology-icon-picker';
import { findTechnologyIcon } from '../../../shared/technology-icon-picker/technology-icons';

type CareerTab = 'skills' | 'experience' | 'education';
type DeleteTarget = { type: CareerTab; id: number; name: string };
const OPTIONAL_HTTP_URL = /^(?:https?:\/\/[^\s]+)?$/;

@Component({
  selector: 'app-admin-career',
  imports: [ReactiveFormsModule, TechnologyIconPicker],
  templateUrl: './career.html',
})
export class AdminCareer {
  private readonly api = inject(CareerService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  @ViewChild('careerDialog') private careerDialog?: ElementRef<HTMLElement>;
  @ViewChild('skillIconChooser') private skillIconChooser?: ElementRef<HTMLButtonElement>;
  @ViewChild('deleteDialog') private deleteDialog?: ElementRef<HTMLElement>;
  private returnFocusTarget: HTMLElement | null = null;

  readonly tabs: { id: CareerTab; label: string }[] = [
    { id: 'skills', label: 'Skills' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
  ];
  readonly activeTab = signal<CareerTab>('skills');
  readonly skills = signal<Skill[]>([]);
  readonly experiences = signal<Experience[]>([]);
  readonly education = signal<Education[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly editorOpen = signal(false);
  readonly iconPickerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly deleteTarget = signal<DeleteTarget | null>(null);
  readonly loadError = signal('');
  readonly actionError = signal('');
  readonly validationError = signal('');
  readonly successMessage = signal('');

  readonly skillForm = this.fb.group({
    name: ['', Validators.maxLength(180)],
    category: ['', Validators.maxLength(80)],
    level: ['', Validators.maxLength(40)],
    icon: ['', Validators.maxLength(120)],
    url: ['', [Validators.maxLength(2048), Validators.pattern(OPTIONAL_HTTP_URL)]],
  });
  readonly experienceForm = this.fb.group({
    position: ['', Validators.maxLength(180)],
    company: ['', Validators.maxLength(180)],
    location: ['', Validators.maxLength(180)],
    startDate: [''],
    endDate: [''],
    current: false,
    description: [''],
    companyWebsite: ['', [Validators.maxLength(2048), Validators.pattern(OPTIONAL_HTTP_URL)]],
  });
  readonly educationForm = this.fb.group({
    institution: ['', Validators.maxLength(180)],
    degree: ['', Validators.maxLength(180)],
    fieldOfStudy: ['', Validators.maxLength(180)],
    startDate: [''],
    endDate: [''],
    current: false,
    description: [''],
    institutionWebsite: ['', [Validators.maxLength(2048), Validators.pattern(OPTIONAL_HTTP_URL)]],
  });

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const requested = params.get('tab');
      this.activeTab.set(this.tabs.some((tab) => tab.id === requested) ? requested as CareerTab : 'skills');
    });
    this.loadAll();
  }

  selectTab(tab: CareerTab): void {
    this.successMessage.set('');
    this.actionError.set('');
    if (!this.saving()) this.editorOpen.set(false);
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, queryParamsHandling: 'merge' });
  }

  loadAll(): void {
    this.loading.set(true);
    this.loadError.set('');
    let finished = 0;
    const complete = (): void => { finished += 1; if (finished === 3) this.loading.set(false); };
    this.api.getSkills().subscribe({ next: (items) => { this.skills.set(items); complete(); }, error: (error: unknown) => { this.loadError.set(this.httpMessage(error, 'Skills')); complete(); } });
    this.api.getExperiences().subscribe({ next: (items) => { this.experiences.set(items); complete(); }, error: (error: unknown) => { this.loadError.set(this.httpMessage(error, 'experiences')); complete(); } });
    this.api.getEducation().subscribe({ next: (items) => { this.education.set(items); complete(); }, error: (error: unknown) => { this.loadError.set(this.httpMessage(error, 'education')); complete(); } });
  }

  openCreate(): void {
    this.actionError.set('');
    this.successMessage.set('');
    this.rememberFocus();
    this.editingId.set(null);
    this.resetCurrentForm();
    this.editorOpen.set(true);
    queueMicrotask(() => this.focusFirst(this.careerDialog));
  }

  openSkillEdit(item: Skill): void {
    this.editingId.set(item.id);
    this.skillForm.reset({ name: item.name ?? '', category: item.category ?? '', level: item.level ?? '', icon: item.icon ?? '', url: item.url ?? '' });
    this.openEditor();
  }

  openExperienceEdit(item: Experience): void {
    this.editingId.set(item.id);
    this.experienceForm.reset({ position: item.position ?? '', company: item.company ?? '', location: item.location ?? '',
      startDate: item.startDate ?? '', endDate: item.endDate ?? '', current: item.current ?? false,
      description: item.description ?? '', companyWebsite: item.companyWebsite ?? '' });
    this.openEditor();
  }

  openEducationEdit(item: Education): void {
    this.editingId.set(item.id);
    this.educationForm.reset({ institution: item.institution ?? '', degree: item.degree ?? '', fieldOfStudy: item.fieldOfStudy ?? '',
      startDate: item.startDate ?? '', endDate: item.endDate ?? '', current: item.current ?? false,
      description: item.description ?? '', institutionWebsite: item.institutionWebsite ?? '' });
    this.openEditor();
  }

  private openEditor(): void { this.actionError.set(''); this.successMessage.set(''); this.rememberFocus(); this.editorOpen.set(true); queueMicrotask(() => this.focusFirst(this.careerDialog)); }
  closeEditor(): void { if (!this.saving()) { this.editorOpen.set(false); this.restoreFocus(); } }

  @HostListener('document:keydown.escape') onEscape(): void {
    if (this.deleteTarget()) this.cancelDelete();
    else if (this.editorOpen()) this.closeEditor();
  }

  trapDialogFocus(event: KeyboardEvent, dialog: HTMLElement | undefined): void {
    if (event.key !== 'Tab' || !dialog) return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && this.document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && this.document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  save(): void {
    if (this.saving()) return;
    this.actionError.set('');
    this.validationError.set('');
    switch (this.activeTab()) {
      case 'skills': this.saveSkill(); break;
      case 'experience': this.saveExperience(); break;
      case 'education': this.saveEducation(); break;
    }
  }

  private saveSkill(): void {
    if (this.skillForm.invalid) {
      this.showValidationError(this.skillForm, 'Enter a valid HTTP(S) URL.');
      return;
    }
    const value = this.skillForm.getRawValue();
    const body = { name: value.name.trim(), category: value.category.trim(), level: value.level.trim(), icon: value.icon.trim(), url: value.url.trim() };
    this.saving.set(true);
    const request = this.editingId() === null ? this.api.createSkill(body) : this.api.updateSkill(this.editingId()!, body);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => { this.skills.update((items) => this.replaceItem(items, saved)); this.finishSave(this.editingId() === null ? 'Skill created.' : 'Skill updated.'); },
      error: (error: unknown) => this.actionError.set(this.httpMessage(error, 'skill')),
    });
  }

  private saveExperience(): void {
    if (this.experienceForm.invalid) {
      this.showValidationError(this.experienceForm, 'Enter a valid HTTP(S) company website.');
      return;
    }
    if (this.hasInvalidPeriod(this.experienceForm.controls.startDate.value, this.experienceForm.controls.endDate.value)) {
      this.showValidationError(this.experienceForm, 'End date must be on or after the start date.', '#experience-end');
      return;
    }
    const value = this.experienceForm.getRawValue();
    const body = { ...value, position: value.position.trim(), company: value.company.trim(), location: value.location.trim(), startDate: value.startDate || null, endDate: value.endDate || null, description: value.description.trim(), companyWebsite: value.companyWebsite.trim() };
    this.saving.set(true);
    const request = this.editingId() === null ? this.api.createExperience(body) : this.api.updateExperience(this.editingId()!, body);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => { this.experiences.update((items) => this.replaceItem(items, saved)); this.finishSave(this.editingId() === null ? 'Experience created.' : 'Experience updated.'); },
      error: (error: unknown) => this.actionError.set(this.httpMessage(error, 'experience')),
    });
  }

  private saveEducation(): void {
    if (this.educationForm.invalid) {
      this.showValidationError(this.educationForm, 'Enter a valid HTTP(S) institution website.');
      return;
    }
    if (this.hasInvalidPeriod(this.educationForm.controls.startDate.value, this.educationForm.controls.endDate.value)) {
      this.showValidationError(this.educationForm, 'End date must be on or after the start date.', '#education-end');
      return;
    }
    const value = this.educationForm.getRawValue();
    const body = { ...value, institution: value.institution.trim(), degree: value.degree.trim(), fieldOfStudy: value.fieldOfStudy.trim(), startDate: value.startDate || null, endDate: value.endDate || null, description: value.description.trim(), institutionWebsite: value.institutionWebsite.trim() };
    this.saving.set(true);
    const request = this.editingId() === null ? this.api.createEducation(body) : this.api.updateEducation(this.editingId()!, body);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => { this.education.update((items) => this.replaceItem(items, saved)); this.finishSave(this.editingId() === null ? 'Education created.' : 'Education updated.'); },
      error: (error: unknown) => this.actionError.set(this.httpMessage(error, 'education')),
    });
  }

  private hasInvalidPeriod(start: string, end: string): boolean { return !!start && !!end && end < start; }
  periodInvalid(start: string, end: string): boolean { return this.hasInvalidPeriod(start, end); }
  private replaceItem<T extends { id: number }>(items: T[], saved: T): T[] {
    return items.some((item) => item.id === saved.id) ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items];
  }
  private finishSave(message: string): void { this.editorOpen.set(false); this.successMessage.set(message); this.restoreFocus(); }

  askDelete(type: CareerTab, item: Skill | Experience | Education): void {
    this.rememberFocus();
    const name = (type === 'skills' ? (item as Skill).name : type === 'experience' ? (item as Experience).position : (item as Education).institution) ?? '';
    this.deleteTarget.set({ type, id: item.id, name });
    this.actionError.set('');
    this.successMessage.set('');
    queueMicrotask(() => this.focusFirst(this.deleteDialog));
  }

  cancelDelete(): void { if (!this.deleting()) { this.deleteTarget.set(null); this.restoreFocus(); } }
  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target || this.deleting()) return;
    this.deleting.set(true);
    this.actionError.set('');
    const request = target.type === 'skills' ? this.api.deleteSkill(target.id)
      : target.type === 'experience' ? this.api.deleteExperience(target.id) : this.api.deleteEducation(target.id);
    request.pipe(finalize(() => this.deleting.set(false))).subscribe({
      next: () => {
        if (target.type === 'skills') this.skills.update((items) => items.filter((item) => item.id !== target.id));
        else if (target.type === 'experience') this.experiences.update((items) => items.filter((item) => item.id !== target.id));
        else this.education.update((items) => items.filter((item) => item.id !== target.id));
        this.deleteTarget.set(null);
        this.successMessage.set('Item deleted.');
        this.restoreFocus();
      },
      error: (error: unknown) => this.actionError.set(this.httpMessage(error, 'item')),
    });
  }

  dateRange(start: string | null, end: string | null, current: boolean | null): string {
    return `${this.formatDate(start)} — ${current ? 'Present' : this.formatDate(end)}`;
  }
  iconLabel(value: string | null): string { return value?.trim().slice(0, 2).toUpperCase() || '✳'; }
  technologyIcon(value: string | null) { return value ? findTechnologyIcon(value) : undefined; }
  chooseSkillIcon(value: string): void {
    this.skillForm.controls.icon.setValue(value);
    this.skillForm.controls.icon.markAsTouched();
    this.iconPickerOpen.set(false);
    this.validationError.set('');
    queueMicrotask(() => this.skillIconChooser?.nativeElement.focus());
  }
  closeIconPicker(): void {
    this.iconPickerOpen.set(false);
    queueMicrotask(() => this.skillIconChooser?.nativeElement.focus());
  }
  clearValidationError(): void { this.validationError.set(''); }
  loadList(): void { this.loadAll(); }

  private resetCurrentForm(): void {
    if (this.activeTab() === 'skills') this.skillForm.reset({ name: '', category: '', level: '', icon: '', url: '' });
    if (this.activeTab() === 'experience') this.experienceForm.reset({ position: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '', companyWebsite: '' });
    if (this.activeTab() === 'education') this.educationForm.reset({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', current: false, description: '', institutionWebsite: '' });
  }
  private formatDate(value: string | null): string {
    if (!value) return '';
    return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
  }
  private rememberFocus(): void {
    const active = this.document.activeElement;
    this.returnFocusTarget = active instanceof HTMLElement ? active : null;
  }
  private focusFirst(dialog?: ElementRef<HTMLElement>): void {
    dialog?.nativeElement.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')?.focus();
  }
  private restoreFocus(): void { queueMicrotask(() => this.returnFocusTarget?.focus()); }
  private showValidationError(form: AbstractControl, message: string, selector?: string): void {
    form.markAllAsTouched();
    this.validationError.set(message);
    queueMicrotask(() => {
      const dialog = this.careerDialog?.nativeElement;
      if (!dialog) return;
      const firstInvalid = selector ? dialog.querySelector<HTMLElement>(selector)
        : dialog.querySelector<HTMLElement>('form input.ng-invalid, form select.ng-invalid, form textarea.ng-invalid');
      firstInvalid?.scrollIntoView({ block: 'center', behavior: 'auto' });
      firstInvalid?.focus();
    });
  }
  private httpMessage(error: unknown, item: string): string {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 400) return 'Some information is invalid. Check the fields and try again.';
    if (status === 401) return 'Your session has expired. Sign in again to continue.';
    if (status === 403) return 'Access was denied. Refresh your session and try again.';
    if (status === 404) return 'This item no longer exists. Refresh the list.';
    if (status >= 500) return 'The server could not complete this request. Try again later.';
    return `Could not load or save ${item}. Check your connection and try again.`;
  }
}
