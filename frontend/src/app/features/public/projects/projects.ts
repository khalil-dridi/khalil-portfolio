import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Project } from './data-access/project.models';
import { ProjectService } from './data-access/project.service';

type ProjectModal = 'demo' | 'github' | 'description';

@Component({
  selector: 'app-projects',
  imports: [],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  private readonly api = inject(ProjectService);
  @ViewChild('projectDialog') private dialog?: ElementRef<HTMLDialogElement>;
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selected = signal<Project | null>(null);
  readonly modal = signal<ProjectModal>('description');

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getProjects().subscribe({
      next: (projects) => { this.projects.set(projects); this.loading.set(false); },
      error: () => { this.error.set('Projects couldn’t load. Please try again.'); this.loading.set(false); },
    });
  }

  technologies(project: Project): string[] {
    return (project.technologies ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  }

  mediaUrl(url: string | null): string | null {
    if (!url) return null;
    if (/^(https?:|blob:|data:)/i.test(url)) return url;
    return `${url.startsWith('/') ? '' : '/'}${url}`;
  }

  open(project: Project, modal: ProjectModal): void {
    this.selected.set(project);
    this.modal.set(modal);
    if (this.dialog && !this.dialog.nativeElement.open) this.dialog.nativeElement.showModal();
  }

  close(): void { this.dialog?.nativeElement.close(); this.selected.set(null); }
  backdrop(event: MouseEvent): void { if (event.target === this.dialog?.nativeElement) this.close(); }
  escape(event: Event): void { event.preventDefault(); this.close(); }

  githubUrl(project: Project): string | null {
    const url = project.githubUrl?.trim();
    return url && /^https?:\/\//i.test(url) ? url : null;
  }
}
