import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RegistrationPage from '../src/pages/RegistrationPage';

function mockFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RegistrationPage', () => {
  it('renders all required fields', () => {
    render(<RegistrationPage onRegistered={() => {}} onBack={() => {}} />);
    expect(screen.getByLabelText('First name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
  });

  it('shows validation errors for an invalid form', () => {
    render(<RegistrationPage onRegistered={() => {}} onBack={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getAllByText('This field is required.')).toHaveLength(3);
  });

  it('rejects a name containing digits', () => {
    render(<RegistrationPage onRegistered={() => {}} onBack={() => {}} />);
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'John123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByText('Letters only (no digits or symbols).')).toBeInTheDocument();
  });

  it('rejects an invalid email and shows city for players', () => {
    render(<RegistrationPage onRegistered={() => {}} onBack={() => {}} />);
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad-email' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Warsaw' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
  });

  it('posts to /api/register and reports the registered user', async () => {
    const fetchMock = mockFetchOk({ user_id: 7, role: 'field owner' });
    vi.stubGlobal('fetch', fetchMock);

    const onRegistered = vi.fn();
    render(<RegistrationPage onRegistered={onRegistered} onBack={() => {}} />);

    // Switch to field owner so no city is required.
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'field owner' } });
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Ann' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Smith' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ann@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/register',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    await waitFor(() => {
      expect(onRegistered).toHaveBeenCalledWith({ user_id: 7, role: 'field owner', city: undefined });
    });
  });

  it('surfaces a server error message', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Email is already registered.' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<RegistrationPage onRegistered={() => {}} onBack={() => {}} />);
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Ann' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Smith' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ann@example.com' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'field owner' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText('Email is already registered.')).toBeInTheDocument();
    });
  });
});