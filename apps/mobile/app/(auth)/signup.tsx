import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        className="pt-14 px-6 pb-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text className="text-blue-500 text-base">← Back</Text>
      </TouchableOpacity>

      <ScrollView className="flex-1 px-8 pt-6" keyboardShouldPersistTaps="handled">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Create account</Text>
        <Text className="text-gray-500 mb-10">Start your eye care journey</Text>

        <Text className="text-sm font-medium text-gray-700 mb-2">Full name</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 mb-5"
          placeholder="Ahaan"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
        />

        <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 mb-5"
          placeholder="you@example.com"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 mb-10"
          placeholder="Min 8 characters"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          onPress={() => router.replace('/(app)')}
          className="bg-blue-500 rounded-2xl py-4 items-center mb-6"
          activeOpacity={0.85}
        >
          <Text className="text-white text-base font-semibold">Create account</Text>
        </TouchableOpacity>

        <View className="flex-row justify-center pb-12">
          <Text className="text-gray-500 text-sm">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-blue-500 text-sm font-semibold">Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
