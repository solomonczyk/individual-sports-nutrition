import React from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/store/auth-store'
import { healthProfileService } from '../../src/services/health-profile-service'
import i18n from '../../src/i18n'

export default function ProfileScreen() {
  const router = useRouter()
  const { user } = useAuthStore()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['healthProfile'],
    queryFn: () => healthProfileService.get(),
  })

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text>Loading...</Text>
      </SafeAreaView>
    )
  }

  if (!profile?.data) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView className="flex-1 px-6 py-8">
          <View className="items-center justify-center flex-1">
            <Text className="text-xl font-semibold text-gray-900 mb-4">
              No Health Profile
            </Text>
            <Text className="text-gray-600 text-center mb-8">
              Create your health profile to get personalized recommendations
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/health-profile/create')}
              className="bg-blue-600 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Create Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  const profileData = profile.data

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView className="flex-1">
        <View className="px-6 py-4">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              {i18n.t('profile', { defaultValue: 'Profile' })}
            </Text>
            <Text className="text-gray-600">{user?.email}</Text>
          </View>

          {/* Profile Info */}
          <View className="bg-gray-50 rounded-lg p-6 mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">Personal Info</Text>
              <TouchableOpacity
                onPress={() => router.push('/health-profile/edit')}
                className="flex-row items-center"
              >
                <Ionicons name="create-outline" size={20} color="#2563eb" />
                <Text className="text-blue-600 ml-1">Edit</Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Age</Text>
                <Text className="font-semibold text-gray-900">{profileData.age} years</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Gender</Text>
                <Text className="font-semibold text-gray-900 capitalize">{profileData.gender}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Weight</Text>
                <Text className="font-semibold text-gray-900">{profileData.weight} kg</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Height</Text>
                <Text className="font-semibold text-gray-900">{profileData.height} cm</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Activity Level</Text>
                <Text className="font-semibold text-gray-900 capitalize">
                  {profileData.activity_level.replace('_', ' ')}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Goal</Text>
                <Text className="font-semibold text-gray-900 capitalize">{profileData.goal}</Text>
              </View>
            </View>
          </View>

          {/* Health Info */}
          {(profileData.allergies?.length > 0 ||
            profileData.diseases?.length > 0 ||
            profileData.medications?.length > 0) && (
            <View className="bg-gray-50 rounded-lg p-6 mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Health Information</Text>

              {profileData.allergies?.length > 0 && (
                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">Allergies</Text>
                  {profileData.allergies.map((allergy, index) => (
                    <Text key={index} className="font-semibold text-gray-900">
                      • {allergy}
                    </Text>
                  ))}
                </View>
              )}

              {profileData.diseases?.length > 0 && (
                <View className="mb-4">
                  <Text className="text-gray-600 mb-2">Diseases</Text>
                  {profileData.diseases.map((disease, index) => (
                    <Text key={index} className="font-semibold text-gray-900">
                      • {disease}
                    </Text>
                  ))}
                </View>
              )}

              {profileData.medications?.length > 0 && (
                <View>
                  <Text className="text-gray-600 mb-2">Medications</Text>
                  {profileData.medications.map((medication, index) => (
                    <Text key={index} className="font-semibold text-gray-900">
                      • {medication}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

