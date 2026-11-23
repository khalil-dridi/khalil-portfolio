import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProfile } from '../../profile/data-access/profile.models';
import { Profile } from './profile';

describe('Profile', () => {
  let fixture: ComponentFixture<Profile>;
  let component: Profile;
  let http: HttpTestingController;

  const initialProfile: AdminProfile = {
    id: 1,
    firstName: 'Ada',
    lastName: 'Lovelace',
    professionalTitle: 'Engineer',
    biography: 'Profile biography',
    email: 'ada@example.test',
    phone: '+441234567',
    location: 'London',
    profileImageUrl: '/api/profile/image',
    resumeUrl: 'https://example.test/cv.pdf',
    githubUrl: 'https://github.com/ada',
    linkedinUrl: 'https://linkedin.com/in/ada',
    availability: true,
    createdAt: '2026-01-01T10:00:00',
    updatedAt: '2026-01-02T10:00:00',
  };

  function loadProfile(profile: AdminProfile = initialProfile): void {
    http.expectOne('/api/admin/profile').flush(profile);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('loads the admin profile and initializes the form, including availability', () => {
    expect(fixture.nativeElement.textContent).toContain('Chargement du profil');
    expect(component.completeness()).toBe(0);
    loadProfile();
    expect(component.profile()).toEqual(initialProfile);
    expect(component.form.controls.firstName.value).toBe('Ada');
    expect(component.form.controls.availability.value).toBeTrue();
    expect(component.form.pristine).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Profile Management');
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
    expect(fixture.nativeElement.textContent).toContain('100%');
  });

  it('shows a retryable loading error and normalizes nullable profile fields', () => {
    http.expectOne('/api/admin/profile').flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(component.loading()).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Impossible de charger');

    component.loadProfile();
    http.expectOne('/api/admin/profile').flush({
      ...initialProfile, firstName: null, lastName: null, biography: null, email: null,
      professionalTitle: null, phone: null, location: null, resumeUrl: null, githubUrl: null, linkedinUrl: null,
      profileImageUrl: null,
    });
    fixture.detectChanges();
    expect(component.profile()?.firstName).toBeNull();
    expect(component.form.controls.firstName.value).toBe('');
    expect(component.form.controls.email.value).toBe('');
    expect(component.completeness()).toBe(0);
  });

  it('validates email, URL schemes and configured maximum lengths', () => {
    loadProfile();
    component.form.controls.email.setValue('ada@example.test');
    component.form.controls.githubUrl.setValue('https://github.com/ada');
    expect(component.form.valid).toBeTrue();
    component.form.controls.email.setValue('invalid');
    component.form.controls.resumeUrl.setValue('ftp://example.test/cv');
    expect(component.form.controls.email.hasError('email')).toBeTrue();
    expect(component.form.controls.resumeUrl.hasError('httpUrl')).toBeTrue();
    component.form.controls.firstName.setValue('x'.repeat(101));
    expect(component.form.controls.firstName.hasError('maxlength')).toBeTrue();
    component.submit();
    expect(component.form.controls.firstName.touched).toBeTrue();
    http.expectNone('/api/admin/profile');
  });

  it('does not submit unchanged forms or start a second save while one is pending', () => {
    loadProfile();
    component.submit();
    http.expectNone('/api/admin/profile');
    component.form.controls.location.setValue('Paris');
    component.form.controls.location.markAsDirty();
    component.submit();
    expect(component.saving()).toBeTrue();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBeTrue();
    component.submit();
    http.expectOne('/api/admin/profile').flush({ ...initialProfile, location: 'Paris' });
    expect(component.saving()).toBeFalse();
  });

  it('does not submit invalid email or URL values', () => {
    loadProfile();
    component.form.controls.email.setValue('not-an-email');
    component.form.controls.githubUrl.setValue('javascript:alert(1)');
    component.submit();

    expect(component.form.invalid).toBeTrue();
    expect(component.form.controls.email.touched).toBeTrue();
    http.expectNone('/api/admin/profile');
  });

  it('sends only dirty fields, keeps cleared strings empty, and preserves false availability', () => {
    loadProfile();
    component.form.controls.firstName.setValue('');
    component.form.controls.firstName.markAsDirty();
    component.form.controls.availability.setValue(false);
    component.form.controls.availability.markAsDirty();
    expect(component.form.valid).toBeTrue();
    expect(component.form.dirty).toBeTrue();
    component.submit();

    const request = http.expectOne('/api/admin/profile');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      firstName: '', lastName: null, professionalTitle: null, biography: null,
      email: null, phone: null, location: null, resumeUrl: null, githubUrl: null,
      linkedinUrl: null, availability: false,
    });
    request.flush({ ...initialProfile, firstName: '', availability: false });
    fixture.detectChanges();

    expect(component.profile()?.availability).toBeFalse();
    expect(component.form.controls.firstName.value).toBe('');
    expect(component.form.pristine).toBeTrue();
    expect(component.successMessage()).toContain('enregistrées');
  });

  it('sends every edited form field when the full profile is changed', () => {
    loadProfile();
    const updates = {
      firstName: 'Khalil', lastName: 'Dridi', professionalTitle: 'Architect',
      biography: 'A refreshed biography.', email: 'khalil@example.test', phone: '+21612345678',
      location: 'Tunis', resumeUrl: 'https://example.test/cv',
      githubUrl: 'https://github.com/khalil', linkedinUrl: 'https://linkedin.com/in/khalil',
      availability: true,
    };
    component.form.patchValue(updates);
    Object.values(component.form.controls).forEach((control) => control.markAsDirty());
    component.submit();

    const request = http.expectOne('/api/admin/profile');
    expect(request.request.body).toEqual(updates);
    request.flush({ ...initialProfile, ...updates });
    expect(component.form.pristine).toBeTrue();
  });

  it('reports update failures without discarding the edited values', () => {
    loadProfile();
    component.form.controls.professionalTitle.setValue('New title');
    component.form.controls.professionalTitle.markAsDirty();
    expect(component.form.valid).toBeTrue();
    expect(component.form.dirty).toBeTrue();
    component.submit();
    http.expectOne('/api/admin/profile').flush({}, { status: 500, statusText: 'Server Error' });

    expect(component.errorMessage()).toContain('serveur');
    expect(component.form.controls.professionalTitle.value).toBe('New title');
    expect(component.form.dirty).toBeTrue();
  });

  it('rejects unsupported and oversized images before creating previews', () => {
    loadProfile();
    const createPreview = spyOn(URL, 'createObjectURL');
    const input = document.createElement('input');
    const unsupported = new File(['data'], 'portrait.gif', { type: 'image/gif' });
    Object.defineProperty(input, 'files', { configurable: true, value: [unsupported] });
    component.onFileSelected({ target: input } as unknown as Event);
    expect(component.errorMessage()).toContain('Format non pris en charge');
    expect(createPreview).not.toHaveBeenCalled();

    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { configurable: true, value: [oversized] });
    component.onFileSelected({ target: input } as unknown as Event);
    expect(component.errorMessage()).toContain('5 Mio');
    expect(createPreview).not.toHaveBeenCalled();
  });

  it('previews and uploads a valid image, then cache-busts the server image', () => {
    loadProfile();
    spyOn(URL, 'createObjectURL').and.returnValue('blob:profile-preview');
    spyOn(URL, 'revokeObjectURL');
    const file = new File(['webp-image'], 'portrait.webp', { type: 'image/webp' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    component.onFileSelected({ target: input } as unknown as Event);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.image-preview img')?.getAttribute('src')).toBe('blob:profile-preview');

    component.uploadImage(input);
    const request = http.expectOne('/api/admin/profile/image');
    expect(request.request.method).toBe('POST');
    expect((request.request.body as FormData).get('file')).toBe(file);
    expect(request.request.headers.has('Content-Type')).toBeFalse();
    request.flush({ imageUrl: '/api/profile/image', contentType: 'image/webp' });
    fixture.detectChanges();

    expect(component.profile()?.profileImageUrl).toBe('/api/profile/image');
    expect(component.imageVersion()).toBeGreaterThan(0);
    expect(component.selectedFile()).toBeNull();
    expect(component.successMessage()).toContain('mise à jour');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:profile-preview');
    expect(fixture.nativeElement.querySelector('.image-preview app-profile-image img')?.getAttribute('src')).toContain('?v=');
  });

  it('supports PNG selection and preview cancellation, including an empty selection', () => {
    loadProfile();
    const createPreview = spyOn(URL, 'createObjectURL').and.returnValue('blob:png-preview');
    const revokePreview = spyOn(URL, 'revokeObjectURL');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { configurable: true, value: [] });
    component.onFileSelected({ target: input } as unknown as Event);
    expect(component.selectedFile()).toBeNull();

    const png = new File(['png'], 'portrait.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { configurable: true, value: [png] });
    component.onFileSelected({ target: input } as unknown as Event);
    expect(createPreview).toHaveBeenCalledWith(png);
    expect(component.selectedPreview()).toBe('blob:png-preview');
    component.cancelImageSelection(input);
    expect(component.selectedFile()).toBeNull();
    expect(component.selectedPreview()).toBeNull();
    expect(revokePreview).toHaveBeenCalledWith('blob:png-preview');
  });

  it('replaces and revokes the previous preview URL', () => {
    loadProfile();
    const createPreview = spyOn(URL, 'createObjectURL').and.returnValues('blob:first', 'blob:second');
    const revokePreview = spyOn(URL, 'revokeObjectURL');
    const input = document.createElement('input');
    for (const name of ['first.jpg', 'second.webp']) {
      const type = name.endsWith('.jpg') ? 'image/jpeg' : 'image/webp';
      Object.defineProperty(input, 'files', { configurable: true, value: [new File(['x'], name, { type })] });
      component.onFileSelected({ target: input } as unknown as Event);
    }
    expect(createPreview).toHaveBeenCalledTimes(2);
    expect(component.selectedPreview()).toBe('blob:second');
    expect(revokePreview).toHaveBeenCalledWith('blob:first');
  });

  it('keeps upload state through a pending request and reports upload and delete failures', () => {
    loadProfile();
    spyOn(URL, 'createObjectURL').and.returnValue('blob:pending');
    const file = new File(['png'], 'portrait.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    component.onFileSelected({ target: input } as unknown as Event);
    component.uploadImage(input);
    expect(component.uploading()).toBeTrue();
    component.cancelImageSelection(input);
    expect(component.selectedFile()).toBe(file);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('.image-management input[type="file"]') as HTMLInputElement).disabled).toBeTrue();
    component.uploadImage(input);
    http.expectOne('/api/admin/profile/image').flush({}, { status: 500, statusText: 'Server Error' });
    expect(component.uploading()).toBeFalse();
    expect(component.errorMessage()).toContain('stockage de l’image');

    component.deleteImage(input);
    expect(component.deletingImage()).toBeTrue();
    component.cancelImageSelection(input);
    expect(component.selectedFile()).toBe(file);
    http.expectOne('/api/admin/profile/image').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(component.deletingImage()).toBeFalse();
    expect(component.errorMessage()).toContain('droits nécessaires');
    expect(component.profile()?.profileImageUrl).toBe(initialProfile.profileImageUrl);
  });

  it('does not upload without a selection, delete a missing image, or cancel during a request', () => {
    loadProfile({ ...initialProfile, profileImageUrl: null });
    const input = document.createElement('input');
    component.uploadImage(input);
    component.deleteImage(input);
    http.expectNone('/api/admin/profile/image');
    expect(component.deletingImage()).toBeFalse();
  });

  it('shows server upload failures and deletes the current image', () => {
    loadProfile();
    spyOn(URL, 'createObjectURL').and.returnValue('blob:failed-preview');
    const file = new File(['jpeg'], 'portrait.jpg', { type: 'image/jpeg' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    component.onFileSelected({ target: input } as unknown as Event);
    component.uploadImage(input);
    http.expectOne('/api/admin/profile/image').flush({}, { status: 415, statusText: 'Unsupported Media Type' });
    expect(component.errorMessage()).toContain('JPG, PNG ou WebP');

    component.deleteImage(input);
    const request = http.expectOne('/api/admin/profile/image');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    expect(component.profile()?.profileImageUrl).toBeNull();
    expect(component.successMessage()).toContain('supprimée');
  });

  it('releases the temporary preview URL when the component is destroyed', () => {
    loadProfile();
    spyOn(URL, 'createObjectURL').and.returnValue('blob:cleanup');
    const revoke = spyOn(URL, 'revokeObjectURL');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { configurable: true, value: [new File(['x'], 'x.png', { type: 'image/png' })] });
    component.onFileSelected({ target: input } as unknown as Event);
    component.ngOnDestroy();
    expect(revoke).toHaveBeenCalledWith('blob:cleanup');
  });
});
