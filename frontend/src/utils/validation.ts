/** Client-side validators for the registration and owner forms. */

export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** First/last names: letters (Latin + accented) and spaces/hyphens only. */
const NAME_PATTERN = /^[A-Za-zÀ-ÿ' -]+$/;

export type Errors = Record<string, string>;

export function validateName(value: string): string {
  if (!value.trim()) return 'This field is required.';
  if (!NAME_PATTERN.test(value)) return 'Letters only (no digits or symbols).';
  return '';
}

export function validateEmail(value: string): string {
  if (!value.trim()) return 'This field is required.';
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address.';
  return '';
}

export function validateCity(value: string): string {
  if (!value.trim()) return 'Enter your city.';
  return '';
}

/** Built-in validation for the file input (jpg/png) and max 5 MB per photo. */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function validatePhotos(files: File[]): Errors {
  const errors: Errors = {};
  if (files.length < 4) {
    errors.photos = 'Upload at least 4 photos (one per side of the field).';
    return errors;
  }
  const wrongType = files.find((f) => !ACCEPTED_IMAGE_TYPES.includes(f.type));
  if (wrongType) {
    errors.photos = `${wrongType.name} is not a JPG/PNG image.`;
    return errors;
  }
  const tooBig = files.find((f) => f.size > MAX_PHOTO_BYTES);
  if (tooBig) {
    errors.photos = `${tooBig.name} exceeds the 5 MB limit.`;
    return errors;
  }
  return errors;
}