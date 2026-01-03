import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, ModernButton, ModernInput } from '../ui';
import { DesignTokens } from '../../constants/DesignTokens';
import i18n from '../../i18n';

interface AddProgressModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { weight: number; bodyFat?: number; notes?: string }) => void;
  loading?: boolean;
}

export const AddProgressModal: React.FC<AddProgressModalProps> = ({
  visible,
  onClose,
  onSave,
  loading,
}) => {
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
      setError(i18n.t('invalid_weight'));
      return;
    }
    
    const bodyFatNum = bodyFat ? parseFloat(bodyFat) : undefined;
    if (bodyFat && (isNaN(bodyFatNum!) || bodyFatNum! < 1 || bodyFatNum! > 60)) {
      setError(i18n.t('invalid_body_fat'));
      return;
    }

    onSave({
      weight: weightNum,
      bodyFat: bodyFatNum,
      notes: notes.trim() || undefined,
    });
    
    // Reset form
    setWeight('');
    setBodyFat('');
    setNotes('');
    setError('');
  };

  return (
    <Modal visible={visible} onClose={onClose} title={i18n.t('add_progress')}>
      <View style={styles.content}>
        {error && <Text style={styles.error}>{error}</Text>}
        
        <ModernInput
          label={`${i18n.t('weight')} (kg) *`}
          value={weight}
          onChangeText={setWeight}
          placeholder="70.5"
          keyboardType="decimal-pad"
          icon="fitness-outline"
        />
        
        <ModernInput
          label={`${i18n.t('body_fat')} (%)`}
          value={bodyFat}
          onChangeText={setBodyFat}
          placeholder="15.0"
          keyboardType="decimal-pad"
          icon="body-outline"
        />
        
        <ModernInput
          label={i18n.t('notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder={i18n.t('notes_placeholder')}
          multiline
          icon="document-text-outline"
        />
      </View>

      <View style={styles.footer}>
        <ModernButton title={i18n.t('cancel')} onPress={onClose} variant="outline" style={styles.cancelButton} />
        <ModernButton title={i18n.t('save')} onPress={handleSave} loading={loading} style={styles.saveButton} />
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  content: { gap: 4 },
  error: { color: DesignTokens.colors.error, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelButton: { flex: 1 },
  saveButton: { flex: 2 },
});
