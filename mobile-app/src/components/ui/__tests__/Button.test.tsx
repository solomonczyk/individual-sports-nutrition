import React from 'react';
import { render, fireEvent } from '@/src/test-utils';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders correctly with text', () => {
    const { getByText } = render(<Button>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button onPress={onPressMock}>Press</Button>);
    
    fireEvent.press(getByText('Press'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button disabled onPress={onPressMock}>
        Disabled
      </Button>
    );
    
    const button = getByText('Disabled').parent;
    expect(button).toBeDisabled();
  });

  it('shows loading state', () => {
    const { getByTestId } = render(
      <Button loading testID="button">
        Loading
      </Button>
    );
    
    expect(getByTestId('button')).toBeTruthy();
  });

  it('applies variant styles correctly', () => {
    const { getByText, rerender } = render(
      <Button variant="primary">Primary</Button>
    );
    
    expect(getByText('Primary')).toBeTruthy();
    
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(getByText('Secondary')).toBeTruthy();
  });
});
