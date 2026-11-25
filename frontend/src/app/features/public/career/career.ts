import { DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CareerResponse, Skill } from '../../career/data-access/career.models';
import { CareerService } from '../../career/data-access/career.service';
import { findTechnologyIcon, TechnologyIcon } from '../../../shared/technology-icon-picker/technology-icons';

type CareerTab = 'skills' | 'experience' | 'education';
interface SkillGroup { category: string; skills: Skill[]; }

@Component({
  selector: 'app-career',
  templateUrl: './career.html',
})
export class Career {
  private readonly api = inject(CareerService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  readonly career = signal<CareerResponse>({ skills: [], experiences: [], education: [] });
  readonly loading = signal(true);
  readonly error = signal('');
  readonly activeTab = signal<CareerTab>('skills');
  readonly tabs: { id: CareerTab; number: string; label: string }[] = [
    { id: 'skills', number: '01', label: 'Skills' },
    { id: 'experience', number: '02', label: 'Experience' },
    { id: 'education', number: '03', label: 'Education' },
  ];
  readonly skillGroups = computed<SkillGroup[]>(() => {
    const groups = new Map<string, Skill[]>();
    for (const skill of this.career().skills) {
      const category = skill.category?.trim() || 'Other';
      groups.set(category, [...(groups.get(category) ?? []), skill]);
    }
    return [...groups.entries()].map(([category, skills]) => ({ category, skills }));
  });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getCareer().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.career.set({ skills: response.skills ?? [], experiences: response.experiences ?? [], education: response.education ?? [] });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Career information could not be loaded. Please try again.');
        this.loading.set(false);
      },
    });
  }

  selectTab(id: CareerTab): void { this.activeTab.set(id); }

  onTabKeydown(event: KeyboardEvent, index: number): void {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % this.tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + this.tabs.length) % this.tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = this.tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const tab = this.tabs[nextIndex];
    this.selectTab(tab.id);
    this.document.getElementById(`career-tab-${tab.id}`)?.focus();
  }

  technologyIcon(id: string | null): TechnologyIcon | undefined {
    return id ? findTechnologyIcon(id) : undefined;
  }

  externalUrl(value: string | null): string | null {
    const url = value?.trim() ?? '';
    return /^https?:\/\/[^\s]+$/.test(url) ? url : null;
  }

  iconLabel(icon: string | null): string {
    const value = icon ?? '';
    return value.trim().slice(0, 2).toUpperCase() || '✳';
  }

  formatDate(value: string | null): string {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  }

  range(start: string | null, end: string | null, current: boolean | null): string {
    const formattedStart = this.formatDate(start);
    const formattedEnd = this.formatDate(end);
    if (formattedStart && current) return `${formattedStart} — Present`;
    if (formattedStart && formattedEnd) return `${formattedStart} — ${formattedEnd}`;
    return formattedStart || formattedEnd || (current ? 'Current' : '');
  }
}
