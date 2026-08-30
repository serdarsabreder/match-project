import { useCallback, useEffect, useState } from 'react';
import FieldCard from '../components/FieldCard';
import { getJSON, postJSON } from '../utils/api';
import type { BookingResponse, Field } from '../types';
import type { SessionUser } from '../App';

interface FieldsPageProps {
  user: SessionUser;
}

type BookingState = {
  fieldId: number;
  date: string;
  loading: boolean;
  message: string;
};

/**
 * Players view: lists fields available in the user's city (GET /api/fields?city=...)
 * and lets them book a field on a date (POST /api/book).
 */
export default function FieldsPage({ user }: FieldsPageProps) {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<BookingState | null>(null);

  const loadFields = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const city = user.city ? encodeURIComponent(user.city) : '';
      const data = await getJSON<Field[]>(`/api/fields?city=${city}`);
      setFields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fields.');
    } finally {
      setLoading(false);
    }
  }, [user.city]);

  useEffect(() => {
    void loadFields();
  }, [loadFields]);

  const bookField = async (field: Field, date: string) => {
    setBooking({ fieldId: field.id, date, loading: true, message: '' });
    try {
      await postJSON<BookingResponse>('/api/book', {
        field_id: field.id,
        user_id: user.user_id,
        date,
      });
      setBooking({ fieldId: field.id, date, loading: false, message: `Booked for ${date}!` });
    } catch (err) {
      setBooking({
        fieldId: field.id,
        date,
        loading: false,
        message: err instanceof Error ? err.message : 'Booking failed.',
      });
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <h2 className="form__page-title">Fields in {user.city}</h2>
        <button type="button" className="btn btn--ghost" onClick={() => void loadFields()}>
          Refresh
        </button>
      </div>

      {booking?.message && <div className="form__notice">{booking.message}</div>}

      {loading && <p className="state-info">Loading fields…</p>}
      {error && <p className="state-error">{error}</p>}
      {!loading && !error && fields.length === 0 && (
        <p className="state-info">No fields found in {user.city} yet. Check back soon!</p>
      )}

      {!loading && !error && fields.length > 0 && (
        <div className="fields-grid">
          {fields.map((field) => (
            <FieldCard
              key={field.id}
              name={field.name}
              address={field.address}
              areaM2={field.area_m2}
              turfType={field.turf_type}
              condition={field.condition}
              photo={field.photos[0]}
              booking={booking?.fieldId === field.id && booking.loading}
              bookedMessage={
                booking?.fieldId === field.id && !booking.loading ? booking.message : ''
              }
              onBook={(date) => void bookField(field, date)}
            />
          ))}
        </div>
      )}
    </section>
  );
}