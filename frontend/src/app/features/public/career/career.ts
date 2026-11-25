import { Component, computed, inject, signal } from '@angular/core';
import { CareerResponse, Skill } from '../../career/data-access/career.models';
import { CareerService } from '../../career/data-access/career.service';

interface SkillGroup { category: string; items: Skill[]; }

@Component({
  selector: 'app-career',
  templateUrl: './career.html',
})
export class Career {
  private readonly api = inject(CareerService);
  readonly career = signal<CareerResponse>({ skills: [], experiences: [], education: [] });
  readonly loading = signal(true);
  readonly error = signal('');
  readonly skillGroups = computed<SkillGroup[]>(() => {
    const groups = new Map<string, Skill[]>();
    for (const skill of this.career().skills) {
      const category = skill.category.trim() || 'Other';
      groups.set(category, [...(groups.get(category) ?? []), skill]);
    }
    return [...groups.entries()].map(([category, items]) => ({ category, items }));
  });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getCareer().subscribe({
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

  externalUrl(value: string): string | null {
    const url = value.trim();
    return /^https?:\/\/[^\s]+$/.test(url) ? url : null;
  }

  iconLabel(icon: string): string {
    const known: Record<string, string> = {
      angular: 'A', java: 'J', spring: 'S', 'spring-boot': 'S', typescript: 'TS', javascript: 'JS',
      docker: 'D', mysql: 'My', postgresql: 'Pg', git: 'G', github: 'GH', node: 'N', 'node.js': 'N',
      html: '5', css: '3', python: 'Py', kotlin: 'K', react: 'R', aws: 'AWS', kubernetes: 'K8s',
    };
    return known[icon.trim().toLowerCase()] ?? (icon.trim().slice(0, 2).toUpperCase() || '✳');
  }

  formatDate(value: string): string {
    if (!value) return '';
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  }
  range(start: string, end: string, current: boolean): string {
    return `${this.formatDate(start)} — ${current ? 'Present' : this.formatDate(end)}`;
  }
}
