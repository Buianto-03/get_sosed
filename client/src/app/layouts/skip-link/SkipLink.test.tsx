import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('focuses the content container when it has no main element', () => {
    render(
      <>
        <SkipLink targetId="content" />
        <div id="content"><h1>Страница</h1></div>
      </>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'К основному содержимому' }));
    expect(document.getElementById('content')).toHaveFocus();
  });
});
