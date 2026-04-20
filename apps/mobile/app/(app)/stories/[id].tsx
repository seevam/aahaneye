import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type { Story, ApiResponse } from '@eyecare/shared';

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['story', id],
    queryFn: () => apiClient<ApiResponse<Story>>(`/stories/${id}`, { skipAuth: true }),
    enabled: !!id,
  });

  const story = data?.data;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!story) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Story not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="px-6 py-6">
      <View className="mb-4">
        <Text className="text-xs text-gray-400 uppercase mb-2">
          {story.category.replace('_', ' ')} · {story.language.toUpperCase()}
        </Text>
        <Text className="text-2xl font-bold text-gray-900">{story.title}</Text>
        {story.author && (
          <Text className="text-sm text-gray-500 mt-2">By {story.author}</Text>
        )}
      </View>

      {story.bodyText && (
        <Text className="text-base text-gray-700 leading-relaxed">{story.bodyText}</Text>
      )}
    </ScrollView>
  );
}
