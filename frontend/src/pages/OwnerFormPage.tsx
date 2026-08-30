import { FormEvent, useState } from 'react';
import { postForm } from '../utils/api';
import { validatePhotos } from '../utils/validation';
import type { Condition, Field, TurfType } from '../types';

interface OwnerFormPageProps {
  ownerId: number;
}

interface OwnerFormState {
  name: string;
  address: string;
  city: string;
  areaM2: string;
  constructionDate: string;
  condition: Condition;
  turfType: TurfType;
  turfHeightCm: string;
}

const initialState: OwnerFormState = {
  name: '',
  address: '',
  city: '',
  areaM2: '',
  constructionDate: '',
  condition: 'excellent',
  turfType: 'artificial',
  turfHeightCm: '',
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Owner form: area size, construction date, condition, turf type/height,
 * and at least 4 photos (jpg/png, max 5 MB each). Submitted via FormData.
 */
export default function OwnerFormPage({ ownerId }: OwnerFormPageProps) {
  const [form, setForm] = useState<OwnerFormState>(initialState);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState<Field | null>(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof OwnerFormState) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  /** Simulates upload progress while the real POST request runs in parallel. */
  const animateProgress = (): number => {
    setProgress(15);
    return window.setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.floor(Math.random() * 15)));
    }, 250);
  };

  const onPhotosChange = (files: FileList | null) => {
    const next = files ? Array.from(files) : [];
    setPhotos(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
    setErrors((e) => ({ ...e, photos: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Field name is required.';
    if (!form.address.trim()) next.address = 'Address is required.';
    if (!form.city.trim()) next.city = 'City is required.';
    if (form.areaM2 === '' || Number(form.areaM2) <= 0) next.areaM2 = 'Enter a positive area (m²).';
    if (!form.constructionDate) next.constructionDate = 'Pick the construction date.';
    if (form.turfHeightCm === '' || Number(form.turfHeightCm) <= 0) {
      next.turfHeightCm = 'Enter a positive turf height (cm).';
    }

    const photoErrors = validatePhotos(photos);
    setErrors({ ...next, ...photoErrors });
    return Object.keys({ ...next, ...photoErrors }).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    if (form.constructionDate > todayISO()) {
      setErrors((prev) => ({ ...prev, constructionDate: 'Construction date cannot be in the future.' }));
      return;
    }

    setSubmitting(true);
    const data = new FormData();
    data.append('owner_id', String(ownerId));
    data.append('name', form.name.trim());
    data.append('address', form.address.trim());
    data.append('city', form.city.trim());
    data.append('area_m2', form.areaM2);
    data.append('construction_date', form.constructionDate);
    data.append('condition', form.condition);
    data.append('turf_type', form.turfType);
    data.append('turf_height_cm', form.turfHeightCm);
    photos.forEach((f) => data.append('files', f, f.name));

    try {
      const timer = animateProgress();
      const field = await postForm<Field>('/api/field', data);
      window.clearInterval(timer);
      setProgress(100);
      setSuccess(field);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to add the field.');
      setProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="page">
        <div className="form">
          <h2 className="form__page-title">Your field is live!</h2>
          <p>
            “{success.name}” in {success.city} was added with {success.photos.length} photos.
            Players in {success.city} can now book it.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <h2 className="form__page-title">List your field</h2>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className={`form__field ${errors.name ? 'field--invalid' : ''}`}>
          <label className="form__label" htmlFor="name">Field name</label>
          <input id="name" className="form__input" value={form.name} onChange={(e) => setField('name')(e.target.value)} />
          {errors.name && <span className="form__error">{errors.name}</span>}
        </div>

        <div className={`form__field ${errors.address ? 'field--invalid' : ''}`}>
          <label className="form__label" htmlFor="address">Address</label>
          <input id="address" className="form__input" value={form.address} onChange={(e) => setField('address')(e.target.value)} />
          {errors.address && <span className="form__error">{errors.address}</span>}
        </div>

        <div className={`form__field ${errors.city ? 'field--invalid' : ''}`}>
          <label className="form__label" htmlFor="city">City</label>
          <input id="city" className="form__input" value={form.city} onChange={(e) => setField('city')(e.target.value)} />
          {errors.city && <span className="form__error">{errors.city}</span>}
        </div>

        <div className={`form__field ${errors.areaM2 ? 'field--invalid' : ''}`}>
          <label className="form__label" htmlFor="areaM2">Area size (m²)</label>
          <input id="areaM2" className="form__input" type="number" min="1" value={form.areaM2} onChange={(e) => setField('areaM2')(e.target.value)} />
          {errors.areaM2 && <span className="form__error">{errors.areaM2}</span>}
        </div>

        <div className={`form__field ${errors.constructionDate ? 'field--invalid' : ''}`}>
          <label className="form__label" htmlFor="constructionDate">Construction date</label>
          <input id="constructionDate" className="form__input" type="date" max={todayISO()} value={form.constructionDate} onChange={(e) => setField('constructionDate')(e.target.value)} />
          {errors.constructionDate && <span className="form__error">{errors.constructionDate}</span>}
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="condition">Condition</label>
          <select id="condition" className="form__select" value={form.condition} onChange={(e) => setField('condition')(e.target.value as Condition)}>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="satisfactory">Satisfactory</option>
            <option value="poor">Poor</option>
          </select>
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="turfType">Turf type</label>
          <select id="turfType" className="form__select" value={form.turfType} onChange={(e) => setField('turfType')(e.target.value as TurfType)}>
            <option value="natural">Natural</option>
            <option value="artificial">Artificial</option>
          </select>
        </div>

        <div className={`form__field ${errors.turfHeightCm ? 'field--invalid' : ''}`}>
          <label className="form__label" htmlFor="turfHeightCm">Turf height (cm)</label>
          <input id="turfHeightCm" className="form__input" type="number" min="0.1" step="0.1" value={form.turfHeightCm} onChange={(e) => setField('turfHeightCm')(e.target.value)} />
          {errors.turfHeightCm && <span className="form__error">{errors.turfHeightCm}</span>}
        </div>

        <div className={`form__field ${errors.photos ? 'field--invalid' : ''}`}>
          <label className="form__label" htmlFor="photos">
            Photos (min 4 — all sides)
          </label>
          <input
            id="photos"
            className="form__input"
            type="file"
            accept="image/jpeg,image/png"
            multiple
            onChange={(e) => onPhotosChange(e.target.files)}
          />
          {errors.photos && <span className="form__error">{errors.photos}</span>}
          {previews.length > 0 && (
            <div className="photos-preview">
              {previews.map((src, i) => (
                <img key={i} className="photo-thumb" src={src} alt={`Field photo ${i + 1}`} />
              ))}
            </div>
          )}
        </div>

        {serverError && <div className="form__notice">{serverError}</div>}

        {submitting && (
          <div>
            <div className="progress">
              <div className="progress__bar" style={{ width: `${progress}%` }} />
            </div>
            <p className="progress__label">Uploading photos… {progress}%</p>
          </div>
        )}

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Add field'}
        </button>
      </form>
    </section>
  );
}