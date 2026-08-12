import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VisitInformation from './VisitInformation';

describe('VisitInformation', () => {
  it('shows general visit details without exposing either exact address', () => {
    render(<VisitInformation />);

    expect(screen.getByRole('heading', { name: 'Visit information' })).toBeInTheDocument();
    expect(screen.getByText('Visit duration:')).toHaveTextContent('Visit duration:');
    expect(screen.getByText('1 hour')).toBeInTheDocument();
    expect(screen.getByText(/only bring fresh bananas and carrots/i)).toBeInTheDocument();
    expect(screen.getByText(/be respectful and do not litter/i)).toBeInTheDocument();

    expect(screen.getByText('Cumming, Georgia')).toBeInTheDocument();
    expect(screen.getByText(/address shared after approval/i)).toBeInTheDocument();
    expect(screen.queryByText(/1945 Old Atlanta/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Melody Mizer/i)).not.toBeInTheDocument();
  });
});
