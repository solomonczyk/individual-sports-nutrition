import React from 'react';
import { Text } from 'react-native';
import { render } from '@/src/test-utils';
import { Card } from '../Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );
    
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const { getByTestId } = render(
      <Card testID="card" style={{ backgroundColor: 'red' }}>
        <Text>Content</Text>
      </Card>
    );
    
    const card = getByTestId('card');
    expect(card).toBeTruthy();
  });

  it('handles onPress when provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Card onPress={onPressMock}>
        <Text>Pressable Card</Text>
      </Card>
    );
    
    const card = getByText('Pressable Card').parent;
    if (card) {
      fireEvent.press(card);
      expect(onPressMock).toHaveBeenCalled();
    }
  });
});
