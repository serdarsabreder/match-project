import { useState } from 'react';

interface FieldCardProps {
  name: string;
  address: string;
  areaM2: number;
  turfType: string;
  condition: string;
  photo?: string;
  onBook: (date: string) => void;
  booking: boolean;
  bookedMessage: string;
}

/** A single field in the players list. */
export default function FieldCard({
  name,
  address,
  areaM2,
  turfType,
  condition,
  photo,
  onBook,
  booking,
  bookedMessage,
}: FieldCardProps) {
  const [date, setDate] = useState('');

  return (
    <article className="field-card">
      {photo ? (
        <img className="field-card__img" src={photo} alt={name} />
      ) : (
        <div className="field-card__img" aria-hidden />
      )}
      <div className="field-card__body">
        <h3 className="field-card__name">{name}</h3>
        <p className="field-card__address">{address}</p>
        <div className="field-card__meta">
          <span className="chip">{areaM2} m²</span>
          <span className="chip">{turfType}</span>
          <span className="chip">{condition}</span>
        </div>
        <div className="field-card__actions">
          <input
            type="date"
            aria-label="Booking date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            type="button"
            className="btn btn--primary"
            disabled={!date || booking}
            onClick={() => onBook(date)}
          >
            {booking ? '…' : 'Book'}
          </button>
        </div>
        {bookedMessage && <span className="form__notice">{bookedMessage}</span>}
      </div>
    </article>
  );
}