import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileImage } from './profile-image';

describe('ProfileImage', () => {
  let fixture: ComponentFixture<ProfileImage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProfileImage] }).compileComponents();
    fixture = TestBed.createComponent(ProfileImage);
  });

  it('shows the accessible fallback when no image is available', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Aucune image de profil disponible"]')).not.toBeNull();
  });

  it('adds the cache version and falls back after an image load failure', () => {
    fixture.componentRef.setInput('imageUrl', '/api/profile/image');
    fixture.componentRef.setInput('cacheVersion', 42);
    fixture.componentRef.setInput('alt', 'Photo de test');
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('/api/profile/image?v=42');
    expect(image.alt).toBe('Photo de test');
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Aucune image de profil disponible"]')).not.toBeNull();
  });
});
