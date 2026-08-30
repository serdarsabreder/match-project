import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WelcomePage from '../src/pages/WelcomePage';

describe('WelcomePage', () => {
  it('renders the heading and subtitle', () => {
    render(<WelcomePage onGetStarted={() => {}} />);
    expect(screen.getByText('You are welcomed by the Match app')).toBeInTheDocument();
    expect(
      screen.getByText('Book a football field or add your field for rent.'),
    ).toBeInTheDocument();
  });

  it('calls onGetStarted when the button is clicked', () => {
    const onGetStarted = vi.fn();
    render(<WelcomePage onGetStarted={onGetStarted} />);
    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    expect(onGetStarted).toHaveBeenCalledTimes(1);
  });
});