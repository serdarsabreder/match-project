import { describe, expect, it } from 'vitest';
import {
  validateEmail,
  validateName,
  validatePhotos,
} from '../src/utils/validation';

describe('validateName', () => {
  it('accepts letters and spaces', () => {
    expect(validateName('John')).toBe('');
    expect(validateName('Ann-Marie O\'Neil')).toBe('');
  });

  it('rejects digits and symbols', () => {
    expect(validateName('John123')).not.toBe('');
    expect(validateName('J@hn')).not.toBe('');
  });

  it('rejects empty values', () => {
    expect(validateName('')).not.toBe('');
    expect(validateName('   ')).not.toBe('');
  });
});

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('player@example.com')).toBe('');
    expect(validateEmail('a.b-c@host.co.uk')).toBe('');
  });

  it('rejects invalid emails', () => {
    expect(validateEmail('not-an-email')).not.toBe('');
    expect(validateEmail('user@nodot')).not.toBe('');
  });

  it('rejects empty values', () => {
    expect(validateEmail('')).not.toBe('');
  });
});

describe('validatePhotos', () => {
  function makeFile(name: string, type: string, size = 1000): File {
    return new File([new Uint8Array(size)], name, { type });
  }

  it('accepts 4 jpg/png files', () => {
    const files = [
      makeFile('a.jpg', 'image/jpeg'),
      makeFile('b.jpg', 'image/jpeg'),
      makeFile('c.png', 'image/png'),
      makeFile('d.png', 'image/png'),
    ];
    expect(validatePhotos(files)).toEqual({});
  });

  it('rejects fewer than 4 files', () => {
    const files = [makeFile('a.jpg', 'image/jpeg')];
    expect(validatePhotos(files).photos).toBeTruthy();
  });

  it('rejects non-image files', () => {
    const files = Array.from({ length: 4 }, () =>
      makeFile('a.txt', 'text/plain'),
    );
    expect(validatePhotos(files).photos).toBeTruthy();
  });

  it('rejects files over 5 MB', () => {
    const files = Array.from({ length: 4 }, () =>
      makeFile('big.png', 'image/png', 6 * 1024 * 1024),
    );
    expect(validatePhotos(files).photos).toBeTruthy();
  });
});