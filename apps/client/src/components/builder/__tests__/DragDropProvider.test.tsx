// DragDropProvider component tests
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DragDropProvider } from '../DragDropProvider';

describe('DragDropProvider', () => {
  it('renders children without crashing', () => {
    render(
      <DragDropProvider>
        <div data-testid="child">hello</div>
      </DragDropProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
