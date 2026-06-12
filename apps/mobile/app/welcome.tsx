import { View, Text, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Hero */}
      <View className="flex-1 items-center justify-center px-8">
        <Image
          source={require('../assets/icon.png')}
          style={{ width: 110, height: 110, borderRadius: 28, marginBottom: 32 }}
          resizeMode="contain"
        />

        <Text className="text-4xl font-bold text-gray-900 text-center mb-3">
          AahanEye
        </Text>
        <Text className="text-base text-gray-500 text-center leading-6">
          Your daily eye care companion.{'\n'}
          Track medications, build healthy habits.
        </Text>
      </View>

      {/* Actions */}
      <View className="px-8 pb-12 gap-3">
        <TouchableOpacity
          onPress={() => router.push('/(auth)/signup')}
          className="bg-blue-500 rounded-2xl py-4 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">Create account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          className="border border-gray-200 rounded-2xl py-4 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-gray-800 text-base font-semibold">Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
