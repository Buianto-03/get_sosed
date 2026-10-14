import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Loader from './Loader';

describe('Loader', () => {
  it('renders its content when not loading', () => {
    render(<Loader loading={false}><p>Loaded content</p></Loader>);
    expect(screen.getByText('Loaded content')).toBeInTheDocument();
  });

  it('shows a progress indicator while loading', () => {
    render(<Loader loading><p>Loaded content</p></Loader>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Loaded content')).not.toBeInTheDocument();
  });
});
