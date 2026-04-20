import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import * as Localization from 'expo-localization';
import { useAuthStore } from '@/stores/auth-store';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const signup = useAuthStore((s) => s.signup);

  const handleSignup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      Alert.alert('Error', 'Please enter an email or phone number');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        timezone: Localization.getCalendars()[0]?.timeZone || 'UTC',
      });
    } catch (err) {
      Alert.alert('Sign Up Failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-6 py-16 justify-center">
      <Text className="text-3xl font-bold text-gray-900 mb-2">Create Account</Text>
      <Text className="text-base text-gray-500 mb-8">
        Start managing your eye care medication schedule
      </Text>

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-4 text-base mb-4"
        placeholder="Full name"
        value={name}
        onChangeText={setName}
        accessibilityLabel="Full name"
      />

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-4 text-base mb-4"
        placeholder="Email (optional if phone provided)"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        accessibilityLabel="Email address"
      />

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-4 text-base mb-4"
        placeholder="Phone (optional if email provided)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        accessibilityLabel="Phone number"
      />

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-4 text-base mb-6"
        placeholder="Password (min 8 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel="Password"
      />

      <TouchableOpacity
        className="bg-primary-500 rounded-xl py-4 items-center min-h-[52px] mb-4"
        onPress={handleSignup}
        disabled={loading}
        accessibilityLabel="Create account"
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-semibold">Create Account</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity className="py-4 items-center min-h-[44px]">
          <Text className="text-gray-600">
            Already have an account?{' '}
            <Text className="text-primary-500 font-semibold">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}
