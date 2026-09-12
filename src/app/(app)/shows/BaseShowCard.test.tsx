import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { testShow } from '@/test/fixtures/tvshow';
import { renderWithProviders } from '@/test/render';
import { BaseShowCard } from './BaseShowCard';

describe('BaseShowCard', () => {
  it('renders show name, description, and country badge', () => {
    renderWithProviders(<BaseShowCard show={testShow} />);
    expect(screen.getByRole('heading', { name: testShow.name })).toBeInTheDocument();
    expect(screen.getByText(testShow.description!)).toBeInTheDocument();
    expect(screen.getByText(testShow.country!)).toBeInTheDocument();
  });

  it('renders action buttons when provided', () => {
    renderWithProviders(<BaseShowCard show={testShow} actions={<button type="button">Refresh</button>} />);
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('renders subscription status badges when provided', () => {
    renderWithProviders(
      <BaseShowCard show={testShow} subscription={{ delay_days: 14, snoozed_until: '2099-12-01' }} />,
    );
    expect(screen.getByText('14d')).toBeInTheDocument();
    expect(screen.getByText('Snoozed')).toBeInTheDocument();
  });
});
