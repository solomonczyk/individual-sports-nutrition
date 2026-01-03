import React from 'react';
import { render } from '@/src/test-utils';
import { Badge } from '../Badge';

describe('Badge Component', () => {
  it('renders text correctly', () => {
    const { getByText } = render(<Badge>New</Badge>);
    expect(getByText('New')).toBeTruthy();
  });

  it('applies variant styles', () => {
    const { getByText, rerender } = render(
      <Badge variant="success">Success</Badge>
    );
    expect(getByText('Success')).toBeTruthy();
    
    rerender(<Badge variant="error">Error</Badge>);
    expect(getByText('Error')).toBeTruthy();
    
    rerender(<Badge variant="warning">Warning</Badge>);
    expect(getByText('Warning')).toBeTruthy();
  });

  it('applies size variants', () => {
    const { getByText, rerender } = render(<Badge size="sm">Small</Badge>);
    expect(getByText('Small')).toBeTruthy();
    
    rerender(<Badge size="lg">Large</Badge>);
    expect(getByText('Large')).toBeTruthy();
  });
});
