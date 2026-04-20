import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type { Story, ApiResponse } from '@eyecare/shared';

export default function StoriesScreen() {
  const { data, isLoading, fetchNextPage, hasNextPage, refetch } = useInfiniteQuery({
    queryKey: ['stories'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient<ApiResponse<Story[]>>(
        `/stories?page=${pageParam}&limit=20`,
        { skipAuth: true },
      );
      return res;
    },
    getNextPageParam: (lastPage, pages) => {
      if ((lastPage.data?.length || 0) < 20) return undefined;
      return pages.length + 1;
    },
    initialPageParam: 1,
  });

  const stories = data?.pages.flatMap((p) => p.data) || [];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'video': return 'bg-red-100 text-red-700';
      case 'tip': return 'bg-green-100 text-green-700';
      case 'patient_story': return 'bg-purple-100 text-purple-700';
      case 'news': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 py-4"
        onRefresh={refetch}
        refreshing={isLoading}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          isLoading ? null : (
            <View className="items-center justify-center py-20">
              <Text className="text-5xl mb-4">📖</Text>
              <Text className="text-xl font-semibold text-gray-700">No stories yet</Text>
              <Text className="text-gray-500 mt-2">Check back soon for eye care content.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Link href={`/(app)/stories/${item.id}`} asChild>
            <TouchableOpacity
              className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
              accessibilityLabel={`${item.title}, ${item.category}`}
              accessibilityRole="button"
            >
              <View className="flex-row items-center mb-2">
                <View className={`rounded-full px-3 py-1 ${getCategoryColor(item.category)}`}>
                  <Text className="text-xs font-medium capitalize">{item.category.replace('_', ' ')}</Text>
                </View>
                <Text className="text-xs text-gray-400 ml-2">{item.language.toUpperCase()}</Text>
              </View>
              <Text className="text-base font-semibold text-gray-900 mb-1">{item.title}</Text>
              {item.bodyText && (
                <Text className="text-sm text-gray-500" numberOfLines={2}>
                  {item.bodyText}
                </Text>
              )}
            </TouchableOpacity>
          </Link>
        )}
      />
    </View>
  );
}
