import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }
    // TODO: call /auth/forgot-password
    setSent(true);
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <TouchableOpacity
        className="absolute top-16 left-6 min-h-[44px] min-w-[44px] justify-center"
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Text className="text-primary-500 text-base">Back</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-gray-900 mb-2">Reset Password</Text>

      {sent ? (
        <Text className="text-base text-gray-500">
          If an account exists with that email or phone, we&apos;ve sent reset instructions.
        </Text>
      ) : (
        <>
          <Text className="text-base text-gray-500 mb-8">
            Enter your email or phone and we&apos;ll send you reset instructions.
          </Text>

          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-4 text-base mb-6"
            placeholder="Email or phone number"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
            accessibilityLabel="Email or phone number"
          />

          <TouchableOpacity
            className="bg-primary-500 rounded-xl py-4 items-center min-h-[52px]"
            onPress={handleReset}
            accessibilityLabel="Send reset instructions"
            accessibilityRole="button"
          >
            <Text className="text-white text-lg font-semibold">Send Reset Link</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
