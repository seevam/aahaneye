import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50 px-6 pt-4">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Profile</Text>

      <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-4">
        <Text className="text-lg font-semibold text-gray-900">{user?.name || 'User'}</Text>
        {user?.email && <Text className="text-sm text-gray-500 mt-1">{user.email}</Text>}
        {user?.phone && <Text className="text-sm text-gray-500 mt-1">{user.phone}</Text>}
      </View>

      {/* Patient profiles section - placeholder */}
      <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-4">
        <Text className="text-base font-semibold text-gray-700 mb-2">Patient Profiles</Text>
        <Text className="text-sm text-gray-400">
          Manage patient profiles for yourself or your loved ones.
        </Text>
        <TouchableOpacity
          className="bg-primary-50 rounded-xl py-3 items-center mt-4 min-h-[44px]"
          accessibilityLabel="Add patient profile"
          accessibilityRole="button"
        >
          <Text className="text-primary-500 font-medium">+ Add Patient</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="bg-white rounded-2xl p-4 border border-gray-100 items-center min-h-[52px] justify-center"
        onPress={handleLogout}
        accessibilityLabel="Sign out"
        accessibilityRole="button"
      >
        <Text className="text-red-500 font-medium">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
