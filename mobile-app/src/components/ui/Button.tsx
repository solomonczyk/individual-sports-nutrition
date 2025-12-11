import { TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { cn } from '../utils/cn'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className,
}: ButtonProps) {
  const baseClasses = 'px-6 py-4 rounded-lg items-center justify-center min-h-[48px]'
  
  const variantClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-gray-200',
    outline: 'border-2 border-blue-600 bg-transparent',
  }

  const textClasses = {
    primary: 'text-white font-semibold',
    secondary: 'text-gray-800 font-semibold',
    outline: 'text-blue-600 font-semibold',
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(baseClasses, variantClasses[variant], disabled && 'opacity-50', className)}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#2563eb'} />
      ) : (
        <Text className={cn(textClasses[variant])}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

