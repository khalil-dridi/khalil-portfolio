import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TechnologyIconPicker } from './technology-icon-picker';

describe('TechnologyIconPicker', () => {
  let fixture: ComponentFixture<TechnologyIconPicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TechnologyIconPicker] }).compileComponents();
    fixture = TestBed.createComponent(TechnologyIconPicker);
    fixture.detectChanges();
  });

  it('filters immediately by technology name', () => {
    const search: HTMLInputElement = fixture.nativeElement.querySelector('.picker-search input');
    search.value = 'Java';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const matches = [...fixture.nativeElement.querySelectorAll('.picker-icon-option')]
      .map((button: Element) => button.textContent.trim());
    expect(matches).toEqual(['Java', 'JavaScript']);

    search.value = 'MySQL';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.picker-icon-option').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('MySQL');
  });

  it('filters categories and confirms the selected identifier', () => {
    const emitted: string[] = [];
    fixture.componentInstance.iconSelected.subscribe((value) => emitted.push(value));
    const frontend: HTMLButtonElement = [...fixture.nativeElement.querySelectorAll('.picker-categories button')]
      .find((button: HTMLButtonElement) => button.textContent.trim() === 'Frontend')!;
    frontend.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.picker-icon-option').length).toBe(6);

    (fixture.nativeElement.querySelector('[aria-label="Select Angular"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.picker-selected-name').textContent.trim()).toBe('Angular');
    (fixture.nativeElement.querySelector('.picker-confirm') as HTMLButtonElement).click();
    expect(emitted).toEqual(['angular']);
  });

  it('clears an existing selection', () => {
    fixture.componentRef.setInput('selectedIcon', 'mysql');
    fixture.detectChanges();
    const emitted: string[] = [];
    fixture.componentInstance.iconSelected.subscribe((value) => emitted.push(value));
    (fixture.nativeElement.querySelector('.picker-clear') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.draftId()).toBe('');
    expect(emitted).toEqual(['']);
    expect(fixture.nativeElement.textContent).toContain('No icon selected');
  });
});
