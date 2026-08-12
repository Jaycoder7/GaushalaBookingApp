import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VisitInformation from './VisitInformation';

describe('VisitInformation', () => {
  it('shows general visit details without exposing either exact address', () => {
    render(<VisitInformation />);

    expect(screen.getByRole('heading', { name: 'Visit information' })).toBeInTheDocument();
    expect(screen.getByText('Expected visit duration:')).toBeInTheDocument();
    expect(screen.getByText('30–45 minutes')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Do' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Don't" })).toBeInTheDocument();
    expect(screen.getByText(/children under age 12/i)).toBeInTheDocument();
    expect(screen.getByText(/purses, bags, backpacks/i)).toBeInTheDocument();
    expect(screen.getByText(/human food such as roti, puri, halwa, ladoos/i)).toBeInTheDocument();
    expect(screen.getByText(/do not bring raw vegetables/i)).toBeInTheDocument();
    expect(screen.getByText(/do not reach through or over a fence/i)).toBeInTheDocument();

    expect(screen.getByText('Cumming, Georgia')).toBeInTheDocument();
    expect(screen.getByText(/address shared after approval/i)).toBeInTheDocument();
    expect(screen.queryByText(/1945 Old Atlanta/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Melody Mizer/i)).not.toBeInTheDocument();
  });
});
