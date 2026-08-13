import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import GaushalaCarousel from './GaushalaCarousel';

describe('GaushalaCarousel', () => {
  beforeAll(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
  });

  it('shows all navigation controls and advances through the photos', async () => {
    const user = userEvent.setup();
    render(<GaushalaCarousel />);

    expect(screen.getByRole('region', { name: /life at the gaushala/i })).toBeVisible();
    expect(screen.getByText('Photo 1 of 12')).toBeVisible();
    expect(screen.getAllByRole('button', { name: /show photo/i })).toHaveLength(12);

    await user.click(screen.getByRole('button', { name: /next gaushala photo/i }));
    expect(screen.getByText('Photo 2 of 12')).toBeVisible();
    expect(screen.getByAltText(/visitor spending time with cows/i)).toBeVisible();
  });

  it('supports keyboard navigation and an autoplay pause control', async () => {
    const user = userEvent.setup();
    render(<GaushalaCarousel />);
    const carousel = screen.getByRole('region', { name: /life at the gaushala/i });

    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expect(screen.getByText('Photo 2 of 12')).toBeVisible();
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expect(screen.getByText('Photo 1 of 12')).toBeVisible();

    await user.click(screen.getByRole('button', { name: /pause photo carousel/i }));
    expect(screen.getByRole('button', { name: /play photo carousel/i })).toBeVisible();
  });
});
