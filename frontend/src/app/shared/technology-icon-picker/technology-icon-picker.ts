import { Component, ElementRef, ViewChild, computed, input, output, signal } from '@angular/core';
import { TECHNOLOGY_CATEGORIES, TECHNOLOGY_ICONS, TechnologyIcon, findTechnologyIcon } from './technology-icons';

@Component({
  selector: 'app-technology-icon-picker',
  imports: [],
  templateUrl: './technology-icon-picker.html',
})
export class TechnologyIconPicker {
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('dialog') private dialog?: ElementRef<HTMLElement>;

  readonly selectedIcon = input('');
  readonly iconSelected = output<string>();
  readonly dismiss = output<void>();
  readonly categories = TECHNOLOGY_CATEGORIES;
  readonly activeCategory = signal('All technologies');
  readonly searchTerm = signal('');
  readonly draftId = signal('');
  readonly filteredIcons = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const category = this.activeCategory();
    return TECHNOLOGY_ICONS.filter((icon) =>
      (category === 'All technologies' || icon.category === category) &&
      (!query || icon.name.toLocaleLowerCase().includes(query)),
    );
  });
  readonly previewIcon = computed(() => findTechnologyIcon(this.draftId()));

  constructor() {
    this.draftId.set(this.selectedIcon());
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.searchInput?.nativeElement.focus());
  }

  choose(icon: TechnologyIcon): void { this.draftId.set(icon.id); }
  clear(): void {
    this.draftId.set('');
    this.iconSelected.emit('');
  }
  confirm(): void {
    if (!this.draftId()) return;
    this.iconSelected.emit(this.draftId());
  }
  close(): void { this.dismiss.emit(); }

  onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }
    if (event.key !== 'Tab' || !this.dialog) return;
    const focusable = [...this.dialog.nativeElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled])',
    )];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onBackdropClick(event: MouseEvent): void { if (event.target === event.currentTarget) this.close(); }
}
