import { Component, HostListener, OnDestroy, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Project } from '../../public/projects/data-access/project.models';
import { ProjectService, ProjectWriteRequest } from '../../public/projects/data-access/project.service';

type MediaKind = 'image' | 'video';
type ProjectForm = FormGroup<{ title: FormControl<string>; description: FormControl<string>; technologies: FormControl<string>; githubUrl: FormControl<string> }>;

@Component({ selector: 'app-admin-projects', imports: [ReactiveFormsModule, DatePipe], templateUrl: './projects.html', styleUrl: './projects.scss' })
export class AdminProjects implements OnDestroy {
  private readonly api = inject(ProjectService);
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly query = signal('');
  readonly editorOpen = signal(false);
  readonly editingProject = signal<Project | null>(null);
  readonly detailsProject = signal<Project | null>(null);
  readonly selectedProject = this.detailsProject;
  readonly deleteTarget = signal<Project | null>(null);
  readonly saving = signal(false);
  readonly imageFile = signal<File | null>(null);
  readonly videoFile = signal<File | null>(null);
  readonly imagePreview = signal<string | null>(null);
  readonly videoPreview = signal<string | null>(null);
  readonly retryImage = signal<File | null>(null);
  readonly retryVideo = signal<File | null>(null);
  readonly retryProject = signal<Project | null>(null);
  readonly uploading = signal<MediaKind | null>(null);
  readonly deletingMedia = signal<MediaKind | null>(null);
  readonly form: ProjectForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(180)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(65535)] }),
    technologies: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
    githubUrl: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2048), Validators.pattern(/^(https?:\/\/(www\.)?github\.com\/[^\s]+)?$/i)] }),
  });

  constructor() { this.load(); }
  @HostListener('document:keydown.escape') onEscape(): void {
    if (this.deleteTarget()) this.cancelDelete();
    else if (this.detailsProject()) this.closeDetails();
    else if (this.editorOpen()) this.closeEditor();
  }
  ngOnDestroy(): void { this.revoke(this.imagePreview()); this.revoke(this.videoPreview()); }
  load(): void {
    this.loading.set(true); this.error.set('');
    this.api.getAdminProjects().subscribe({ next: (items) => { this.projects.set(items); this.loading.set(false); }, error: () => { this.error.set('Projects could not be loaded. Check your access and try again.'); this.loading.set(false); } });
  }
  get filteredProjects(): Project[] {
    const query = this.query().trim().toLocaleLowerCase();
    return query ? this.projects().filter((p) => `${p.title} ${p.description} ${p.technologies ?? ''}`.toLocaleLowerCase().includes(query)) : this.projects();
  }
  get imageCount(): number { return this.projects().filter((p) => !!p.backgroundImageUrl).length; }
  get videoCount(): number { return this.projects().filter((p) => !!p.demoVideoUrl).length; }
  get repositoryCount(): number { return this.projects().filter((p) => !!p.githubUrl).length; }
  technologies(project: Project): string[] { return (project.technologies ?? '').split(',').map((v) => v.trim()).filter(Boolean); }
  trackProject(_index: number, project: Project): number { return project.id; }
  mediaUrl(project: Project, kind: MediaKind): string { return (kind === 'image' ? project.backgroundImageUrl : project.demoVideoUrl) ?? `/api/projects/${project.id}/${kind}`; }
  fileSize(file: File): string { return `${(file.size / (1024 * 1024)).toFixed(2)} Mio`; }
  updateQuery(event: Event): void { this.query.set((event.target as HTMLInputElement).value); }
  openCreate(): void { this.clearPreviews(); this.error.set(''); this.message.set(''); this.editingProject.set(null); this.detailsProject.set(null); this.form.reset({ title: '', description: '', technologies: '', githubUrl: '' }); this.editorOpen.set(true); }
  openEdit(project: Project): void {
    this.error.set(''); this.message.set(''); this.detailsProject.set(null); this.editingProject.set(project); this.form.reset({ title: project.title, description: project.description, technologies: project.technologies ?? '', githubUrl: project.githubUrl ?? '' }); this.editorOpen.set(true);
    this.api.getAdminProject(project.id).subscribe({ next: (fresh) => { if (this.editingProject()?.id === fresh.id) { this.editingProject.set(fresh); this.form.reset({ title: fresh.title, description: fresh.description, technologies: fresh.technologies ?? '', githubUrl: fresh.githubUrl ?? '' }); } }, error: () => this.error.set('Could not refresh this project. You can retry by reopening it.') });
  }
  openDetails(project: Project): void { this.error.set(''); this.clearPreviews(); this.detailsProject.set(project); this.editorOpen.set(false); }
  closeEditor(): void { if (this.saving()) return; this.editorOpen.set(false); this.editingProject.set(null); this.clearPreviews(); }
  closeDetails(): void { if (this.uploading() || this.deletingMedia()) return; this.detailsProject.set(null); this.clearPreviews(); }
  save(): void {
    if (this.saving()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); this.error.set('Veuillez corriger les champs obligatoires et invalides.'); return; }
    const payload: ProjectWriteRequest = { title: this.form.controls.title.value.trim(), description: this.form.controls.description.value.trim(), technologies: this.form.controls.technologies.value.trim(), githubUrl: this.form.controls.githubUrl.value.trim() };
    const current = this.editingProject(); this.saving.set(true); this.error.set('');
    const request = current ? this.api.updateAdminProject(current.id, payload) : this.api.createAdminProject(payload);
    request.subscribe({ next: (saved) => {
      if (current) this.projects.update((items) => items.map((item) => item.id === saved.id ? saved : item)); else this.projects.update((items) => [saved, ...items]);
      this.saving.set(false);
      if (this.imageFile() || this.videoFile()) { this.editorOpen.set(false); this.uploadAfterSave(saved, !!current); }
      else { this.editorOpen.set(false); this.clearPreviews(); this.message.set(current ? 'Projet modifié avec succès.' : 'Projet créé avec succès.'); }
    }, error: (e: unknown) => { this.saving.set(false); this.error.set(this.friendlyError(e, 'Impossible d’enregistrer le projet.')); } });
  }
  askDelete(project: Project): void { this.deleteTarget.set(project); this.error.set(''); }
  cancelDelete(): void { this.deleteTarget.set(null); }
  confirmDelete(): void {
    const target = this.deleteTarget(); if (!target) return;
    this.api.deleteAdminProject(target.id).subscribe({ next: () => { this.projects.update((items) => items.filter((p) => p.id !== target.id)); this.deleteTarget.set(null); this.message.set('Projet supprimé avec succès.'); }, error: (e: unknown) => this.error.set(this.friendlyError(e, 'Impossible de supprimer le projet.')) });
  }
  selectImage(event: Event): void { this.selectFile(event, 'image'); }
  selectVideo(event: Event): void { this.selectFile(event, 'video'); }
  removeImageSelection(input?: HTMLInputElement): void { this.imageFile.set(null); this.revoke(this.imagePreview()); this.imagePreview.set(null); if (input) input.value = ''; }
  removeVideoSelection(input?: HTMLInputElement): void { this.videoFile.set(null); this.revoke(this.videoPreview()); this.videoPreview.set(null); if (input) input.value = ''; }
  uploadSelected(kind: MediaKind): void {
    const project = this.detailsProject(); const file = kind === 'image' ? this.imageFile() : this.videoFile(); if (!project || !file || this.uploading()) return;
    this.retryProject.set(project); this.uploading.set(kind); const request = kind === 'image' ? this.api.uploadAdminImage(project.id, file) : this.api.uploadAdminVideo(project.id, file);
    request.subscribe({ next: () => { const updated = { ...project, [kind === 'image' ? 'backgroundImageUrl' : 'demoVideoUrl']: `${this.mediaUrl(project, kind)}?v=${Date.now()}` }; this.detailsProject.set(updated); this.projects.update((items) => items.map((p) => p.id === updated.id ? updated : p)); this.uploading.set(null); this.removeImageSelection(); this.removeVideoSelection(); this.message.set(kind === 'image' ? 'Image mise à jour.' : 'Vidéo mise à jour.'); }, error: (e: unknown) => { this.uploading.set(null); this.error.set(this.friendlyError(e, `Échec de l’envoi ${kind === 'image' ? 'de l’image' : 'de la vidéo'}.`)); } });
  }
  deleteMedia(kind: MediaKind): void {
    const project = this.detailsProject(); if (!project || this.deletingMedia()) return; this.deletingMedia.set(kind);
    const request = kind === 'image' ? this.api.deleteAdminImage(project.id) : this.api.deleteAdminVideo(project.id);
    request.subscribe({ next: () => { const updated = { ...project, [kind === 'image' ? 'backgroundImageUrl' : 'demoVideoUrl']: null }; this.detailsProject.set(updated); this.projects.update((items) => items.map((p) => p.id === updated.id ? updated : p)); this.deletingMedia.set(null); this.message.set(kind === 'image' ? 'Image supprimée.' : 'Vidéo supprimée.'); }, error: (e: unknown) => { this.deletingMedia.set(null); this.error.set(this.friendlyError(e, 'Impossible de supprimer ce média.')); } });
  }
  retryMedia(kind: MediaKind): void { const project = this.retryProject(); const file = kind === 'image' ? this.retryImage() : this.retryVideo(); if (!project || !file) return; this.mediaUpload(project, kind, file, true); }
  private uploadAfterSave(project: Project, editing: boolean): void {
    const image = this.imageFile(), video = this.videoFile(); this.retryProject.set(project); this.retryImage.set(image); this.retryVideo.set(video); this.clearPreviews();
    const attempts: Array<[MediaKind, File]> = []; if (image) attempts.push(['image', image]); if (video) attempts.push(['video', video]);
    let failures: string[] = []; let remaining = attempts.length;
    for (const [kind, file] of attempts) this.mediaUpload(project, kind, file, false, (success) => { if (success) kind === 'image' ? this.retryImage.set(null) : this.retryVideo.set(null); else failures.push(kind); remaining--; if (!remaining) { const action = editing ? 'modifié' : 'créé'; this.message.set(`Projet ${action}; ` + (failures.length ? 'certains médias n’ont pas été envoyés.' : 'médias ajoutés avec succès.')); if (failures.length) this.error.set(`Projet ${action}, mais échec de l’envoi ${failures.join(' et ')}. Réessayez depuis la fiche du projet.`); } });
  }
  private mediaUpload(project: Project, kind: MediaKind, file: File, clearRetry: boolean, done?: (success: boolean) => void): void {
    const request = kind === 'image' ? this.api.uploadAdminImage(project.id, file) : this.api.uploadAdminVideo(project.id, file);
    request.subscribe({ next: () => { this.projects.update((items) => items.map((p) => p.id === project.id ? { ...p, [kind === 'image' ? 'backgroundImageUrl' : 'demoVideoUrl']: `/api/projects/${project.id}/${kind === 'image' ? 'image' : 'video'}?v=${Date.now()}` } : p)); if (clearRetry) { kind === 'image' ? this.retryImage.set(null) : this.retryVideo.set(null); this.error.set(''); } done?.(true); }, error: () => { if (clearRetry) this.error.set(`Échec de l’envoi ${kind}. Vous pouvez réessayer.`); done?.(false); } });
  }
  private selectFile(event: Event, kind: MediaKind): void {
    const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return; this.error.set('');
    const allowed = kind === 'image' ? ['image/jpeg', 'image/png', 'image/webp'] : ['video/mp4', 'video/webm']; const max = kind === 'image' ? 5 * 1024 * 1024 : 100 * 1024 * 1024;
    const label = kind === 'image' ? 'image' : 'vidéo';
    if (!file.size) { this.error.set(`Le fichier ${label} est vide.`); input.value = ''; return; }
    const extension = file.name.split('.').pop()?.toLocaleLowerCase() ?? '';
    const extensions = kind === 'image' ? ['jpg', 'jpeg', 'png', 'webp'] : ['mp4', 'webm'];
    const mimeMatchesExtension = kind === 'image'
      ? (['jpg', 'jpeg'].includes(extension) ? file.type === 'image/jpeg' : extension === 'png' ? file.type === 'image/png' : extension === 'webp' ? file.type === 'image/webp' : false)
      : (extension === 'mp4' ? file.type === 'video/mp4' : extension === 'webm' ? file.type === 'video/webm' : false);
    if (!allowed.includes(file.type) || !extensions.includes(extension) || !mimeMatchesExtension) { this.error.set(kind === 'image' ? 'Format invalide. Choisissez une image JPG, PNG ou WebP.' : 'Format invalide. Choisissez une vidéo MP4 ou WebM.'); input.value = ''; return; }
    if (file.size > max) { this.error.set(`La taille maximale est de ${kind === 'image' ? '5 Mio' : '100 Mio'}.`); input.value = ''; return; }
    const url = URL.createObjectURL(file);
    if (kind === 'image') { this.revoke(this.imagePreview()); this.imageFile.set(file); this.imagePreview.set(url); }
    else { this.revoke(this.videoPreview()); this.videoFile.set(file); this.videoPreview.set(url); }
  }
  private clearPreviews(): void { this.removeImageSelection(); this.removeVideoSelection(); }
  private revoke(url: string | null): void { if (url?.startsWith('blob:')) URL.revokeObjectURL(url); }
  private friendlyError(error: unknown, fallback: string): string {
    const status = (error as { status?: number })?.status;
    if (status === 400) return 'Les informations ou le fichier sont invalides. Vérifiez les champs et le format du média.';
    if (status === 401) return 'Votre session a expiré. Reconnectez-vous pour continuer.';
    if (status === 403) return 'Accès refusé. Votre session de sécurité a peut-être expiré; rechargez la page.';
    if (status === 404) return 'Ce projet ou ce média n’existe plus. Actualisez la liste.';
    if (status === 413) return 'Le fichier dépasse la taille maximale autorisée.';
    if (status === 415) return 'Ce format de fichier n’est pas pris en charge.';
    if (status === 500) return 'Le serveur n’a pas pu enregistrer la modification. Réessayez plus tard.';
    return fallback;
  }
}
