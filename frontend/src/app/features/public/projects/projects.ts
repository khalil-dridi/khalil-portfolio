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
  readonly activeIndex = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selected = signal<Project | null>(null);
  readonly modal = signal<ProjectModal>('description');
  private pointerStartX: number | null = null;

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getProjects().subscribe({
      next: (projects) => { this.projects.set(projects); this.activeIndex.set(0); this.loading.set(false); },
      error: () => { this.error.set('Projects couldn’t load. Please try again.'); this.loading.set(false); },
    });
  }

  technologies(project: Project): string[] {
    return (project.technologies ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  }

  position(index: number): 'active' | 'previous' | 'next' | 'hidden' {
    const count = this.projects().length;
    if (count <= 1) return index === this.activeIndex() ? 'active' : 'hidden';
    const offset = (index - this.activeIndex() + count) % count;
    if (offset === 0) return 'active';
    if (offset === 1) return 'next';
    if (offset === count - 1) return 'previous';
    return 'hidden';
  }

  previous(): void {
    const count = this.projects().length;
    if (count > 1) this.activeIndex.update((index) => (index - 1 + count) % count);
  }

  next(): void {
    const count = this.projects().length;
    if (count > 1) this.activeIndex.update((index) => (index + 1) % count);
  }

  goTo(index: number): void {
    if (index >= 0 && index < this.projects().length) this.activeIndex.set(index);
  }

  keydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') { event.preventDefault(); this.previous(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); this.next(); }
  }

  pointerDown(event: PointerEvent): void {
    if ((event.pointerType === 'touch' || event.pointerType === 'pen') && !(event.target as HTMLElement).closest('button, a')) {
      this.pointerStartX = event.clientX;
    }
  }

  pointerUp(event: PointerEvent): void {
    if (this.pointerStartX === null) return;
    const distance = event.clientX - this.pointerStartX;
    this.pointerStartX = null;
    if (Math.abs(distance) < 45) return;
    if (distance > 0) this.previous(); else this.next();
  }

  pointerCancel(): void { this.pointerStartX = null; }

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
