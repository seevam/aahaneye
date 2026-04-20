import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, enterGuestMode } = useAuthStore();

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email/phone and password');
      return;
    }

    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</Text>
      <Text className="text-base text-gray-500 mb-8">
        Sign in to manage your eye care reminders
      </Text>

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-4 text-base mb-4"
        placeholder="Email or phone number"
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Email or phone number"
      />

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-4 text-base mb-2"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel="Password"
      />

      <Link href="/(auth)/forgot-password" asChild>
        <TouchableOpacity className="self-end mb-6 min-h-[44px] justify-center">
          <Text className="text-primary-500 text-sm">Forgot password?</Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity
        className="bg-primary-500 rounded-xl py-4 items-center min-h-[52px] mb-4"
        onPress={handleLogin}
        disabled={loading}
        accessibilityLabel="Sign in"
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-semibold">Sign In</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/signup" asChild>
        <TouchableOpacity className="py-4 items-center min-h-[44px]">
          <Text className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Text className="text-primary-500 font-semibold">Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity
        className="py-4 items-center min-h-[44px]"
        onPress={enterGuestMode}
        accessibilityLabel="Continue as guest"
        accessibilityRole="button"
      >
        <Text className="text-gray-400">Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
}
