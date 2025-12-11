import { TextInput, Text, View, TextInputProps } from 'react-native'
import { cn } from '../utils/cn'

interface InputProps extends Omit<TextInputProps, 'className'> {
  label?: string
  error?: string
  className?: string
}

export function Input({
  label,
  error,
  className,
  ...props
}: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      )}
      <TextInput
        {...props}
        className={cn(
          'border border-gray-300 rounded-lg px-4 py-3 text-base',
          error && 'border-red-500',
          className
        )}
      />
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  )
}

