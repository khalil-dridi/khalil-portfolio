import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function optionalHttpUrlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;

    try {
      const url = new URL(value);
      return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname
        ? null
        : { httpUrl: true };
    } catch {
      return { httpUrl: true };
    }
  };
}
