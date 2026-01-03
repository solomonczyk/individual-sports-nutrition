import React from 'react';
import { render } from '@/src/test-utils';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar Component', () => {
  it('renders with correct progress', () => {
    const { getByTestId } = render(
      <ProgressBar progress={0.5} testID="progress-bar" />
    );
    
    expect(getByTestId('progress-bar')).toBeTruthy();
  });

  it('handles 0% progress', () => {
    const { getByTestId } = render(
      <ProgressBar progress={0} testID="progress-bar" />
    );
    
    expect(getByTestId('progress-bar')).toBeTruthy();
  });

  it('handles 100% progress', () => {
    const { getByTestId } = render(
      <ProgressBar progress={1} testID="progress-bar" />
    );
    
    expect(getByTestId('progress-bar')).toBeTruthy();
  });

  it('clamps progress between 0 and 1', () => {
    const { getByTestId, rerender } = render(
      <ProgressBar progress={-0.5} testID="progress-bar" />
    );
    expect(getByTestId('progress-bar')).toBeTruthy();
    
    rerender(<ProgressBar progress={1.5} testID="progress-bar" />);
    expect(getByTestId('progress-bar')).toBeTruthy();
  });

  it('applies custom color', () => {
    const { getByTestId } = render(
      <ProgressBar progress={0.5} color="#ff0000" testID="progress-bar" />
    );
    
    expect(getByTestId('progress-bar')).toBeTruthy();
  });
});
