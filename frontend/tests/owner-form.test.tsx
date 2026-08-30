import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OwnerFormPage from '../src/pages/OwnerFormPage';

function makeFile(name: string): File {
  return new File(['x'], name, { type: 'image/png' });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OwnerFormPage photos', () => {
  it('accumulates photos across multiple selections instead of replacing them', () => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock') });

    render(<OwnerFormPage ownerId={1} />);
    const input = screen.getByLabelText(/photos/i) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makeFile('one.png')] } });
    fireEvent.change(input, { target: { files: [makeFile('two.png')] } });
    fireEvent.change(input, { target: { files: [makeFile('three.png')] } });
    fireEvent.change(input, { target: { files: [makeFile('four.png')] } });

    expect(screen.getAllByAltText(/field photo/i)).toHaveLength(4);
  });
});