import { FormEvent, useState } from 'react';
import { postJSON } from '../utils/api';
import { validateEmail, validateName, validateCity } from '../utils/validation';
import type { Role, RegisterResponse } from '../types';
import type { SessionUser } from '../App';

interface RegistrationPageProps {
  onRegistered: (user: SessionUser) => void;
  onBack: () => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  city: string;
}

const initialState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'player',
  city: '',
};

/**
 * Registration form: first name, last name, email, role (player / field owner).
 * Validates on the client, then sends JSON to POST /api/register.
 */
export default function RegistrationPage({ onRegistered, onBack }: RegistrationPageProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    nextErrors.firstName = validateName(form.firstName);
    nextErrors.lastName = validateName(form.lastName);
    nextErrors.email = validateEmail(form.email);
    if (form.role === 'player') {
      nextErrors.city = validateCity(form.city);
    }
    // Keep only non-empty messages.
    const filtered = Object.fromEntries(Object.entries(nextErrors).filter(([, v]) => v));
    setErrors(filtered);
    return Object.keys(filtered).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        role: form.role,
        city: form.role === 'player' ? form.city.trim() : undefined,
      };
      const res = await postJSON<RegisterResponse>('/api/register', payload);
      onRegistered({
        user_id: res.user_id,
        role: res.role,
        city: form.role === 'player' ? form.city.trim() : undefined,
      });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← Back
        </button>
        <h2 className="form__page-title">Create your account</h2>
        <span style={{ width: 64 }} />
      </div>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className={`form__field ${errors.firstName ? 'field--invalid' : ''}`}>
          <label className="form__label" htmlFor="firstName">
            First name
          </label>
          <input
            id="firstName"
            className="form__input"
            value={form.firstName}
            onChange={(e) => setField('firstName')(e.target.value)}
            name="firstName"
            autoComplete="given-name"
          />
          {errors.firstName && <span className="form__error">{errors.firstName}</span>}
        </div>

        <div className={`form__field ${errors.lastName ? 'field--invalid' : ''}`}>
          <label className="form__label" htmlFor="lastName">
            Last name
          </label>
          <input
            id="lastName"
            className="form__input"
            value={form.lastName}
            onChange={(e) => setField('lastName')(e.target.value)}
            name="lastName"
            autoComplete="family-name"
          />
          {errors.lastName && <span className="form__error">{errors.lastName}</span>}
        </div>

        <div className={`form__field ${errors.email ? 'field--invalid' : ''}`}>
          <label className="form__label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="form__input"
            type="email"
            value={form.email}
            onChange={(e) => setField('email')(e.target.value)}
            name="email"
            autoComplete="email"
          />
          {errors.email && <span className="form__error">{errors.email}</span>}
        </div>

        <div className="form__field">
          <label className="form__label" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            className="form__select"
            value={form.role}
            onChange={(e) => setField('role')(e.target.value as Role)}
            name="role"
          >
            <option value="player">Player</option>
            <option value="field owner">Field owner</option>
          </select>
        </div>

        {form.role === 'player' && (
          <div className={`form__field ${errors.city ? 'field--invalid' : ''}`}>
            <label className="form__label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              className="form__input"
              value={form.city}
              onChange={(e) => setField('city')(e.target.value)}
              name="city"
              placeholder="e.g. Warsaw"
            />
            {errors.city && <span className="form__error">{errors.city}</span>}
          </div>
        )}

        {serverError && <div className="form__notice">{serverError}</div>}

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Registering…' : 'Register'}
        </button>
      </form>
    </section>
  );
}