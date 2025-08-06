import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from '../components/Toast/Toast';

describe('Toast Component', () => {
  it('should render toast when open is true', () => {
    const mockOnClose = vi.fn();

    render(<Toast open={true} message="Test message" onClose={mockOnClose} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should not render toast when open is false', () => {
    const mockOnClose = vi.fn();

    render(<Toast open={false} message="Test message" onClose={mockOnClose} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();

    render(<Toast open={true} message="Test message" onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('should render with different severity levels', () => {
    const mockOnClose = vi.fn();

    const { rerender } = render(
      <Toast open={true} message="Error message" severity="error" onClose={mockOnClose} />
    );

    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledError');

    rerender(
      <Toast open={true} message="Warning message" severity="warning" onClose={mockOnClose} />
    );

    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledWarning');

    rerender(
      <Toast open={true} message="Success message" severity="success" onClose={mockOnClose} />
    );

    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledSuccess');
  });

  it('should use default severity of info', () => {
    const mockOnClose = vi.fn();

    render(<Toast open={true} message="Info message" onClose={mockOnClose} />);

    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledInfo');
  });
});
