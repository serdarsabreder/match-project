import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FieldCard from '../src/components/FieldCard';

const props = {
  name: 'City Arena',
  address: 'Lazu 1, Warsaw',
  areaM2: 4000,
  turfType: 'artificial',
  condition: 'excellent',
  onBook: () => {},
  booking: false,
  bookedMessage: '',
};

describe('FieldCard', () => {
  it('shows field details', () => {
    render(<FieldCard {...props} />);
    expect(screen.getByText('City Arena')).toBeInTheDocument();
    expect(screen.getByText('Lazu 1, Warsaw')).toBeInTheDocument();
    expect(screen.getByText('4000 m²')).toBeInTheDocument();
    expect(screen.getByText('artificial')).toBeInTheDocument();
  });

  it('disables Booking until a date is chosen', () => {
    render(<FieldCard {...props} />);
    expect(screen.getByRole('button', { name: /book/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Booking date'), {
      target: { value: '2026-09-15' },
    });
    expect(screen.getByRole('button', { name: /book/i })).toBeEnabled();
  });

  it('calls onBook with the chosen date', () => {
    const onBook = vi.fn();
    render(<FieldCard {...props} onBook={onBook} />);

    fireEvent.change(screen.getByLabelText('Booking date'), {
      target: { value: '2026-09-15' },
    });
    fireEvent.click(screen.getByRole('button', { name: /book/i }));
    expect(onBook).toHaveBeenCalledWith('2026-09-15');
  });

  it('renders the booking message', () => {
    render(<FieldCard {...props} bookedMessage="Booked for 2026-09-15!" />);
    expect(screen.getByText('Booked for 2026-09-15!')).toBeInTheDocument();
  });
});