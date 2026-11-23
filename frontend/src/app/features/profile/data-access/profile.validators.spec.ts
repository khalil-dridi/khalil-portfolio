import { FormControl } from '@angular/forms';
import { optionalHttpUrlValidator } from './profile.validators';

describe('optionalHttpUrlValidator', () => {
  const validate = (value: unknown) => optionalHttpUrlValidator()(new FormControl(value));

  it('accepts empty optional values and HTTP or HTTPS URLs with a hostname', () => {
    expect(validate('')).toBeNull();
    expect(validate(null)).toBeNull();
    expect(validate('   ')).toBeNull();
    expect(validate('http://example.test/path')).toBeNull();
    expect(validate('https://example.test')).toBeNull();
  });

  it('rejects unsupported schemes, hostless URLs and malformed input', () => {
    expect(validate('ftp://example.test')).toEqual({ httpUrl: true });
    expect(validate('javascript:alert(1)')).toEqual({ httpUrl: true });
    expect(validate('https://')).toEqual({ httpUrl: true });
    expect(validate('not a url')).toEqual({ httpUrl: true });
  });
});
