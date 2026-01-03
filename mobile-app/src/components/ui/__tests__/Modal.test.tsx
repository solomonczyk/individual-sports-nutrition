import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@/src/test-utils';
import { Modal } from '../Modal';

describe('Modal Component', () => {
  it('renders when visible', () => {
    const { getByText } = render(
      <Modal visible onClose={jest.fn()}>
        <Text>Modal Content</Text>
      </Modal>
    );
    
    expect(getByText('Modal Content')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <Modal visible={false} onClose={jest.fn()}>
        <Text>Modal Content</Text>
      </Modal>
    );
    
    expect(queryByText('Modal Content')).toBeNull();
  });

  it('calls onClose when close button is pressed', () => {
    const onCloseMock = jest.fn();
    const { getByTestId } = render(
      <Modal visible onClose={onCloseMock}>
        <Text>Content</Text>
      </Modal>
    );
    
    const closeButton = getByTestId('modal-close-button');
    fireEvent.press(closeButton);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('renders with custom title', () => {
    const { getByText } = render(
      <Modal visible onClose={jest.fn()} title="Custom Title">
        <Text>Content</Text>
      </Modal>
    );
    
    expect(getByText('Custom Title')).toBeTruthy();
  });
});
