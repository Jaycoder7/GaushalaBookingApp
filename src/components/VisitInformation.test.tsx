import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VisitInformation from './VisitInformation';

describe('VisitInformation', () => {
  it('shows the visit details and links both locations to Google Maps', () => {
    render(<VisitInformation />);

    expect(screen.getByRole('heading', { name: 'Visit information' })).toBeInTheDocument();
    expect(screen.getByText('Visit duration:')).toHaveTextContent('Visit duration:');
    expect(screen.getByText('1 hour')).toBeInTheDocument();
    expect(screen.getByText(/only bring fresh bananas and carrots/i)).toBeInTheDocument();
    expect(screen.getByText(/be respectful and do not litter/i)).toBeInTheDocument();

    const gaushala = screen.getByRole('link', { name: '1945 Old Atlanta Rd, Cumming, GA 30041' });
    const parking = screen.getByRole('link', { name: '3100-3660 Melody Mizer Ln, Cumming, GA 30041' });
    expect(gaushala).toHaveAttribute('href', expect.stringContaining('google.com/maps/search'));
    expect(parking).toHaveAttribute('href', expect.stringContaining('google.com/maps/search'));
    expect(gaushala).toHaveAttribute('target', '_blank');
    expect(parking).toHaveAttribute('target', '_blank');
  });
});
