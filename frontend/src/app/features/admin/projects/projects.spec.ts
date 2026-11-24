import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { ProjectService } from '../../public/projects/data-access/project.service';
import { Project } from '../../public/projects/data-access/project.models';
import { AdminProjects } from './projects';

describe('AdminProjects', () => {
  let fixture: ComponentFixture<AdminProjects>;
  let api: jasmine.SpyObj<ProjectService>;
  const project: Project = {
    id: 12,
    title: 'Campus Connect',
    description: 'A campus ride sharing application.',
    technologies: 'Angular, Spring Boot',
    backgroundImageUrl: '/api/projects/12/image',
    demoVideoUrl: null,
    githubUrl: 'https://github.com/example/campus-connect',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<ProjectService>('ProjectService', [
      'getAdminProjects', 'getAdminProject', 'createAdminProject', 'updateAdminProject',
      'deleteAdminProject', 'uploadAdminImage', 'uploadAdminVideo', 'deleteAdminImage', 'deleteAdminVideo',
    ]);
    api.getAdminProjects.and.returnValue(of([project]));
    api.getAdminProject.and.returnValue(of(project));
    api.createAdminProject.and.returnValue(of(project));
    api.updateAdminProject.and.returnValue(of(project));
    api.uploadAdminImage.and.returnValue(of({}));
    api.uploadAdminVideo.and.returnValue(of({}));
    api.deleteAdminProject.and.returnValue(of(void 0));
    api.deleteAdminImage.and.returnValue(of(void 0));
    api.deleteAdminVideo.and.returnValue(of(void 0));
    await TestBed.configureTestingModule({ imports: [AdminProjects], providers: [{ provide: ProjectService, useValue: api }] }).compileComponents();
    fixture = TestBed.createComponent(AdminProjects);
    fixture.detectChanges();
  });

  it('loads projects and calculates media and repository statistics', () => {
    expect(api.getAdminProjects).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('.project-card').length).toBe(1);
    const stats = [...fixture.nativeElement.querySelectorAll('.stat-card strong')].map((item: any) => item.textContent.trim());
    expect(stats).toEqual(['1', '1', '0', '1']);
    expect(fixture.nativeElement.textContent).toContain('Campus Connect');
  });

  it('formats project metadata and identifiers for the dashboard', () => {
    const component = fixture.componentInstance;
    expect(component.technologies(project)).toEqual(['Angular', 'Spring Boot']);
    expect(component.mediaUrl(project, 'video')).toBe('/api/projects/12/video');
    expect(component.trackProject(0, project)).toBe(project.id);
    expect(component.fileSize(new File(['1234'], 'sample.mp4'))).toContain('Mio');
    component.updateQuery({ target: { value: 'campus' } } as unknown as Event);
    expect(component.query()).toBe('campus');
  });

  it('filters projects by description and technologies', () => {
    const search: HTMLInputElement = fixture.nativeElement.querySelector('input[type="search"]');
    search.value = 'spring boot';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.project-card').length).toBe(1);
    search.value = 'nothing here';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.project-card').length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No matching projects');
  });

  it('shows an empty state when the API returns no projects', () => {
    fixture.destroy();
    api.getAdminProjects.and.returnValue(of([]));
    fixture = TestBed.createComponent(AdminProjects);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No projects yet');
  });

  it('shows a retry state when the admin listing fails', () => {
    fixture.destroy();
    api.getAdminProjects.and.returnValue(throwError(() => new Error('private backend detail')));
    fixture = TestBed.createComponent(AdminProjects);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Retry');
    expect(fixture.nativeElement.textContent).not.toContain('private backend detail');
  });

  it('validates required project fields before creating', () => {
    fixture.componentInstance.openCreate();
    fixture.detectChanges();
    const submit: HTMLButtonElement = fixture.nativeElement.querySelector('.dialog-actions .primary-button');
    expect(submit.type).toBe('button');
    expect(submit.disabled).toBeFalse();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.title.touched).toBeTrue();
    expect(fixture.componentInstance.form.controls.description.touched).toBeTrue();
    expect(fixture.componentInstance.error()).toContain('champs obligatoires');
    expect(fixture.nativeElement.textContent).toContain('A title is required.');
    expect(fixture.nativeElement.textContent).toContain('A description is required.');
    expect(fixture.nativeElement.textContent).toContain('champs obligatoires');
    expect(api.createAdminProject).not.toHaveBeenCalled();
  });

  it('creates a project with the supported DTO fields', () => {
    const component = fixture.componentInstance;
    component.openCreate();
    component.form.setValue({ title: project.title, description: project.description, technologies: 'Angular', githubUrl: project.githubUrl! });
    component.save();
    expect(api.createAdminProject).toHaveBeenCalledWith({ title: project.title, description: project.description, technologies: 'Angular', githubUrl: project.githubUrl });
    expect(component.projects()[0]).toEqual(project);
    expect(component.message()).toContain('créé');
  });

  it('loads a project before editing and submits the prepopulated fields', () => {
    const component = fixture.componentInstance;
    component.openEdit(project);
    expect(api.getAdminProject).toHaveBeenCalledWith(project.id);
    expect(component.form.controls.title.value).toBe(project.title);
    component.form.controls.title.setValue('Updated title');
    component.save();
    expect(api.updateAdminProject).toHaveBeenCalledWith(project.id, jasmine.objectContaining({ title: 'Updated title' }));
    expect(component.projects()[0].title).toBe(project.title);
    expect(component.message()).toContain('modifié');
  });

  it('keeps a created project and exposes a retry when its selected media upload fails', () => {
    const component = fixture.componentInstance;
    const image = new File(['image'], 'cover.png', { type: 'image/png' });
    api.uploadAdminImage.and.returnValue(throwError(() => new Error('upload rejected')));
    component.openCreate();
    component.form.setValue({ title: project.title, description: project.description, technologies: '', githubUrl: '' });
    component.imageFile.set(image);
    component.save();
    expect(component.projects().some((item) => item.id === project.id)).toBeTrue();
    expect(component.retryImage()).toBe(image);
    expect(component.error()).toContain('créé');
  });

  it('rejects an unsupported image and accepts a valid image preview', () => {
    const component = fixture.componentInstance;
    const createUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:cover-preview');
    const input = document.createElement('input');
    input.type = 'file';
    const invalid = new File(['no'], 'cover.gif', { type: 'image/gif' });
    Object.defineProperty(input, 'files', { value: [invalid], configurable: true });
    component.selectImage({ target: input } as unknown as Event);
    expect(component.imageFile()).toBeNull();
    expect(component.error()).toContain('JPG');
    const valid = new File(['image'], 'cover.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [valid], configurable: true });
    component.selectImage({ target: input } as unknown as Event);
    expect(createUrl).toHaveBeenCalledWith(valid);
    expect(component.imagePreview()).toBe('blob:cover-preview');
  });

  it('uses enabled type=button controls to open their matching create-modal pickers', () => {
    const component = fixture.componentInstance;
    const addButton = fixture.nativeElement.querySelector('.management-heading .primary-button') as HTMLButtonElement;
    expect(addButton.type).toBe('button');
    expect(addButton.disabled).toBeFalse();
    addButton.click();
    fixture.detectChanges();
    const imageInput: HTMLInputElement = fixture.nativeElement.querySelector('#create-project-image-input');
    const videoInput: HTMLInputElement = fixture.nativeElement.querySelector('#create-project-video-input');
    const imageButton = fixture.nativeElement.querySelector('#create-project-image-button') as HTMLButtonElement;
    const videoButton = fixture.nativeElement.querySelector('#create-project-video-button') as HTMLButtonElement;

    expect(imageInput).toBeTruthy();
    expect(videoInput).toBeTruthy();
    expect(imageButton).toBeTruthy();
    expect(videoButton).toBeTruthy();
    expect(imageButton.type).toBe('button');
    expect(videoButton.type).toBe('button');
    expect(imageButton.disabled).toBeFalse();
    expect(videoButton.disabled).toBeFalse();
    const imagePicker = spyOn(imageInput, 'showPicker');
    const videoPicker = spyOn(videoInput, 'showPicker');
    imageButton.click();
    videoButton.click();
    expect(imagePicker).toHaveBeenCalledTimes(1);
    expect(videoPicker).toHaveBeenCalledTimes(1);
    expect(imageInput.accept).toBe('image/jpeg,image/png,image/webp');
    expect(videoInput.accept).toBe('video/mp4,video/webm');
    expect(imageInput.disabled).toBeFalse();
    expect(videoInput.disabled).toBeFalse();
  });

  it('opens the edit modal without displaying details', () => {
    const component = fixture.componentInstance;
    component.openDetails(project);
    fixture.detectChanges();
    expect(component.detailsProject()).toEqual(project);
    expect(fixture.nativeElement.querySelector('.details-dialog')).toBeTruthy();

    component.openEdit(project);
    fixture.detectChanges();
    expect(component.editorOpen()).toBeTrue();
    expect(component.detailsProject()).toBeNull();
    expect(component.editingProject()).toEqual(project);
    expect(fixture.nativeElement.querySelector('.editor-dialog')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.details-dialog')).toBeFalsy();
  });

  it('opens file pickers from the details modal buttons', () => {
    const component = fixture.componentInstance;
    component.openDetails(project);
    fixture.detectChanges();
    const imageInput: HTMLInputElement = fixture.nativeElement.querySelector('#details-project-image-input');
    const videoInput: HTMLInputElement = fixture.nativeElement.querySelector('#details-project-video-input');
    const buttons = fixture.nativeElement.querySelectorAll('.media-controls .file-button');
    const imageButton: HTMLButtonElement = buttons[0];
    const videoButton: HTMLButtonElement = buttons[1];

    expect(imageInput).toBeTruthy();
    expect(videoInput).toBeTruthy();
    spyOn(imageInput, 'click');
    imageButton.click();
    expect(imageInput.click).toHaveBeenCalled();

    spyOn(videoInput, 'click');
    videoButton.click();
    expect(videoInput.click).toHaveBeenCalled();
  });

  it('accepts JPG, JPEG, PNG, and WebP images and replaces and removes their preview URLs', () => {
    const component = fixture.componentInstance;
    const createUrl = spyOn(URL, 'createObjectURL').and.returnValues('blob:first', 'blob:second', 'blob:third', 'blob:fourth');
    const revokeUrl = spyOn(URL, 'revokeObjectURL');
    const input = document.createElement('input');
    input.type = 'file';
    for (const [name, type] of [['cover.jpg', 'image/jpeg'], ['cover.jpeg', 'image/jpeg'], ['cover.png', 'image/png'], ['cover.webp', 'image/webp']]) {
      const file = new File(['cover'], name, { type });
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      component.selectImage({ target: input } as unknown as Event);
      expect(component.imageFile()).toBe(file);
    }
    expect(createUrl).toHaveBeenCalledTimes(4);
    expect(revokeUrl).toHaveBeenCalledWith('blob:first');
    expect(revokeUrl).toHaveBeenCalledWith('blob:second');
    expect(revokeUrl).toHaveBeenCalledWith('blob:third');
    component.removeImageSelection(input);
    expect(component.imageFile()).toBeNull();
    expect(component.imagePreview()).toBeNull();
    expect(revokeUrl).toHaveBeenCalledWith('blob:fourth');
  });

  it('rejects empty, unsupported, and oversized images without creating previews', () => {
    const component = fixture.componentInstance;
    const createUrl = spyOn(URL, 'createObjectURL');
    const input = document.createElement('input');
    input.type = 'file';
    const empty = new File([], 'empty.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [empty], configurable: true });
    component.selectImage({ target: input } as unknown as Event);
    expect(component.error()).toContain('vide');
    const mismatched = new File(['image'], 'image.png', { type: 'image/jpeg' });
    Object.defineProperty(input, 'files', { value: [mismatched], configurable: true });
    component.selectImage({ target: input } as unknown as Event);
    expect(component.error()).toContain('valide');
    const large = new File(['image'], 'large.png', { type: 'image/png' });
    Object.defineProperty(large, 'size', { value: 5 * 1024 * 1024 + 1 });
    Object.defineProperty(input, 'files', { value: [large], configurable: true });
    component.selectImage({ target: input } as unknown as Event);
    expect(component.error()).toContain('5 Mio');
    expect(createUrl).not.toHaveBeenCalled();
  });

  it('previews MP4 and WebM, supports replacement and removal, and cleans preview URLs on modal close', () => {
    const component = fixture.componentInstance;
    const createUrl = spyOn(URL, 'createObjectURL').and.returnValues('blob:mp4', 'blob:webm');
    const revokeUrl = spyOn(URL, 'revokeObjectURL');
    const input = document.createElement('input');
    input.type = 'file';
    for (const [name, type, preview] of [['demo.mp4', 'video/mp4', 'blob:mp4'], ['demo.webm', 'video/webm', 'blob:webm']]) {
      const file = new File(['video'], name, { type });
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      component.selectVideo({ target: input } as unknown as Event);
      expect(component.videoFile()).toBe(file);
      expect(component.videoPreview()).toBe(preview);
    }
    expect(createUrl).toHaveBeenCalledTimes(2);
    expect(revokeUrl).toHaveBeenCalledWith('blob:mp4');
    component.openCreate();
    expect(component.videoFile()).toBeNull();
    expect(component.videoPreview()).toBeNull();
    expect(revokeUrl).toHaveBeenCalledWith('blob:webm');
  });

  it('rejects empty, unsupported, and oversized videos', () => {
    const component = fixture.componentInstance;
    const input = document.createElement('input');
    input.type = 'file';
    for (const [file, message] of [
      [new File([], 'empty.mp4', { type: 'video/mp4' }), 'vide'],
      [new File(['video'], 'demo.avi', { type: 'video/avi' }), 'MP4 ou WebM'],
    ] as const) {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      component.selectVideo({ target: input } as unknown as Event);
      expect(component.error()).toContain(message);
    }
    const large = new File(['video'], 'large.mp4', { type: 'video/mp4' });
    Object.defineProperty(large, 'size', { value: 100 * 1024 * 1024 + 1 });
    Object.defineProperty(input, 'files', { value: [large], configurable: true });
    component.selectVideo({ target: input } as unknown as Event);
    expect(component.error()).toContain('100 Mio');
  });

  it('uploads image then video using the created project ID and retries media after partial failure', () => {
    const component = fixture.componentInstance;
    const image = new File(['image'], 'cover.jpg', { type: 'image/jpeg' });
    const video = new File(['video'], 'demo.mp4', { type: 'video/mp4' });
    component.openCreate();
    component.form.setValue({ title: project.title, description: project.description, technologies: '', githubUrl: '' });
    component.imageFile.set(image);
    component.videoFile.set(video);
    const uploadOrder: string[] = [];
    api.uploadAdminImage.and.callFake(() => { uploadOrder.push('image'); return throwError(() => new Error('image failure')); });
    api.uploadAdminVideo.and.callFake(() => { uploadOrder.push('video'); return of({}); });
    component.save();
    expect(api.createAdminProject).toHaveBeenCalled();
    expect(api.uploadAdminImage).toHaveBeenCalledWith(project.id, image);
    expect(api.uploadAdminVideo).toHaveBeenCalledWith(project.id, video);
    expect(uploadOrder).toEqual(['image', 'video']);
    expect(component.retryImage()).toBe(image);
    expect(component.retryVideo()).toBeNull();
    expect(component.error()).toContain('image');
    api.uploadAdminImage.and.returnValue(of({}));
    component.retryMedia('image');
    expect(component.retryImage()).toBeNull();
    expect(component.error()).toBe('');
  });

  it('closes the creation modal and reports success after both selected media uploads complete', () => {
    const component = fixture.componentInstance;
    component.openCreate();
    component.form.setValue({ title: project.title, description: project.description, technologies: '', githubUrl: '' });
    component.imageFile.set(new File(['image'], 'cover.png', { type: 'image/png' }));
    component.videoFile.set(new File(['video'], 'demo.webm', { type: 'video/webm' }));
    component.save();
    expect(component.editorOpen()).toBeFalse();
    expect(component.projects()[0].id).toBe(project.id);
    expect(component.message()).toContain('médias');
    expect(component.retryImage()).toBeNull();
    expect(component.retryVideo()).toBeNull();
  });

  it('does not upload media when project creation fails and ignores duplicate submissions', () => {
    const component = fixture.componentInstance;
    const image = new File(['image'], 'cover.png', { type: 'image/png' });
    component.openCreate();
    component.form.setValue({ title: project.title, description: project.description, technologies: '', githubUrl: '' });
    component.imageFile.set(image);
    const creationResponse = new Subject<Project>();
    api.createAdminProject.and.returnValue(creationResponse);
    component.save();
    component.save();
    expect(api.createAdminProject).toHaveBeenCalledTimes(1);
    creationResponse.error(new Error('creation failure'));
    expect(api.uploadAdminImage).not.toHaveBeenCalled();
    expect(component.imageFile()).toBe(image);
    expect(component.editorOpen()).toBeTrue();
  });

  it('uploads and removes project media from the details view', () => {
    const component = fixture.componentInstance;
    component.openDetails(project);
    component.imageFile.set(new File(['image'], 'cover.png', { type: 'image/png' }));
    component.uploadSelected('image');
    expect(api.uploadAdminImage).toHaveBeenCalledWith(project.id, jasmine.any(File));
    expect(component.selectedProject()?.backgroundImageUrl).toContain('?v=');
    component.deleteMedia('image');
    expect(api.deleteAdminImage).toHaveBeenCalledWith(project.id);
    expect(component.selectedProject()?.backgroundImageUrl).toBeNull();
  });

  it('requires confirmation before removing a project', () => {
    const component = fixture.componentInstance;
    component.askDelete(project);
    expect(component.deleteTarget()?.title).toBe(project.title);
    component.confirmDelete();
    expect(api.deleteAdminProject).toHaveBeenCalledWith(project.id);
    expect(component.projects().some((item) => item.id === project.id)).toBeFalse();
    expect(component.deleteTarget()).toBeNull();
  });

  it('drives create and edit controls through the rendered browser DOM', () => {
    const component = fixture.componentInstance;
    const image = new File(['cover'], 'cover.png', { type: 'image/png' });
    const video = new File(['video'], 'demo.mp4', { type: 'video/mp4' });
    const assignFile = (input: HTMLInputElement, file: File) => {
      Object.defineProperty(input, 'files', { configurable: true, value: [file] });
      input.dispatchEvent(new Event('change', { bubbles: true }));
      fixture.detectChanges();
    };

    component.projects.set([]);
    const addButton = fixture.nativeElement.querySelector('.management-heading .primary-button') as HTMLButtonElement;
    expect(addButton.type).toBe('button');
    expect(addButton.disabled).toBeFalse();
    addButton.click();
    fixture.detectChanges();
    const createDialog = fixture.nativeElement.querySelector('.editor-dialog') as HTMLElement;
    expect(createDialog).toBeTruthy();
    const createButton = createDialog.querySelector('.dialog-actions .primary-button') as HTMLButtonElement;
    expect(createButton.type).toBe('button');
    expect(createButton.disabled).toBeFalse();

    const saveHandler = spyOn(component, 'save').and.callThrough();
    createButton.click();
    fixture.detectChanges();
    expect(saveHandler).toHaveBeenCalledTimes(1);
    expect(api.createAdminProject).not.toHaveBeenCalled();
    expect(createDialog.textContent).toContain('A title is required.');
    expect(createDialog.textContent).toContain('A description is required.');

    const title = createDialog.querySelector('input[formcontrolname="title"]') as HTMLInputElement;
    title.value = 'Browser created project';
    title.dispatchEvent(new Event('input', { bubbles: true }));
    const description = createDialog.querySelector('textarea[formcontrolname="description"]') as HTMLTextAreaElement;
    description.value = 'Created from rendered form controls.';
    description.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const imageInput = createDialog.querySelector('#create-project-image-input') as HTMLInputElement;
    const videoInput = createDialog.querySelector('#create-project-video-input') as HTMLInputElement;
    expect(imageInput.type).toBe('file');
    expect(imageInput.disabled).toBeFalse();
    expect(videoInput.type).toBe('file');
    expect(videoInput.disabled).toBeFalse();
    const imageButton = createDialog.querySelector('#create-project-image-button') as HTMLButtonElement;
    const videoButton = createDialog.querySelector('#create-project-video-button') as HTMLButtonElement;
    expect(imageButton.type).toBe('button');
    expect(videoButton.type).toBe('button');
    const imagePickerOpen = spyOn(imageInput, 'showPicker');
    const videoPickerOpen = spyOn(videoInput, 'showPicker');
    imageButton.click();
    videoButton.click();
    expect(imagePickerOpen).toHaveBeenCalledTimes(1);
    expect(videoPickerOpen).toHaveBeenCalledTimes(1);

    const imageChange = spyOn(component, 'selectImage').and.callThrough();
    const videoChange = spyOn(component, 'selectVideo').and.callThrough();
    assignFile(imageInput, image);
    assignFile(videoInput, video);
    expect(imageChange).toHaveBeenCalled();
    expect(videoChange).toHaveBeenCalled();
    expect(component.imageFile()).toBe(image);
    expect(component.videoFile()).toBe(video);

    createButton.click();
    fixture.detectChanges();
    expect(saveHandler).toHaveBeenCalledTimes(2);
    expect(api.createAdminProject).toHaveBeenCalled();
    expect(component.projects()[0].id).toBe(project.id);

    component.projects.set([project]);
    const editButton = fixture.nativeElement.querySelector('.project-card .project-actions button:nth-child(2)') as HTMLButtonElement;
    expect(editButton.disabled).toBeFalse();
    editButton.click();
    fixture.detectChanges();
    const editDialog = fixture.nativeElement.querySelector('.editor-dialog') as HTMLElement;
    expect((editDialog.querySelector('input[formcontrolname="title"]') as HTMLInputElement).value).toBe(project.title);
    const editImage = editDialog.querySelector('#edit-project-image-input') as HTMLInputElement;
    const editVideo = editDialog.querySelector('#edit-project-video-input') as HTMLInputElement;
    expect(editImage).toBeTruthy();
    expect(editVideo).toBeTruthy();
    const editImageButton = editDialog.querySelector('#edit-project-image-button') as HTMLButtonElement;
    const editVideoButton = editDialog.querySelector('#edit-project-video-button') as HTMLButtonElement;
    expect(editImageButton.type).toBe('button');
    expect(editVideoButton.type).toBe('button');
    const editImagePickerOpen = spyOn(editImage, 'showPicker');
    const editVideoPickerOpen = spyOn(editVideo, 'showPicker');
    editImageButton.click();
    editVideoButton.click();
    expect(editImagePickerOpen).toHaveBeenCalledTimes(1);
    expect(editVideoPickerOpen).toHaveBeenCalledTimes(1);
    const editTitle = editDialog.querySelector('input[formcontrolname="title"]') as HTMLInputElement;
    editTitle.value = 'Browser updated project';
    editTitle.dispatchEvent(new Event('input', { bubbles: true }));
    const editDescription = editDialog.querySelector('textarea[formcontrolname="description"]') as HTMLTextAreaElement;
    editDescription.value = 'Updated from rendered form controls.';
    editDescription.dispatchEvent(new Event('input', { bubbles: true }));
    assignFile(editImage, image);
    assignFile(editVideo, video);
    fixture.detectChanges();
    (editDialog.querySelector('.dialog-actions .primary-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(api.updateAdminProject).toHaveBeenCalledWith(project.id, jasmine.objectContaining({ title: 'Browser updated project' }));
    expect(api.uploadAdminImage).toHaveBeenCalledWith(project.id, image);
    expect(api.uploadAdminVideo).toHaveBeenCalledWith(project.id, video);
  });
});
