// RowBlock component tests
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { RowBlock } from '../RowBlock';

function makeSection(overrides: Partial<{ backgroundColor: string }> = {}) {
  return {
    id: 'test-row',
    layoutType: '1col' as const,
    slots: [{ id: 'test-slot', element: null }],
    ...overrides,
  };
}

describe('RowBlock', () => {
  it('renders a white card with border and shadow', () => {
    const { container } = render(<RowBlock section={makeSection()} />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('shadow-sm');
  });

  it('applies section.backgroundColor via inline style', () => {
    const { container } = render(
      <RowBlock section={makeSection({ backgroundColor: '#ff0000' })} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('renders SectionControls with all three buttons', () => {
    render(<RowBlock section={makeSection()} onDelete={vi.fn()} onDuplicate={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Drag to reorder' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicate section' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete section' })).toBeInTheDocument();
  });

  it('delete confirm flow: first click shows "Delete?", second click calls onDelete', () => {
    const onDelete = vi.fn();
    render(<RowBlock section={makeSection()} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete section' }));
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete section' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Delete?'));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('delete confirm cancel returns to normal state', () => {
    render(<RowBlock section={makeSection()} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete section' }));
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByRole('button', { name: 'Delete section' })).toBeInTheDocument();
    expect(screen.queryByText('Delete?')).not.toBeInTheDocument();
  });

  it('applies opacity-40 when isDragging=true', () => {
    const { container } = render(<RowBlock section={makeSection()} isDragging={true} />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('opacity-40');
  });
});
