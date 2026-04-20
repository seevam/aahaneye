import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import { usePatientStore } from '@/stores/patient-store';
import type { ReminderSchedule, ApiResponse } from '@eyecare/shared';

export default function RemindersScreen() {
  const activePatientId = usePatientStore((s) => s.activePatientId);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reminderSchedules', activePatientId],
    queryFn: async () => {
      if (!activePatientId) return { data: [] as ReminderSchedule[] };
      return apiClient<ApiResponse<ReminderSchedule[]>>(
        `/patients/${activePatientId}/reminders`,
      );
    },
    enabled: !!activePatientId,
  });

  const schedules = data?.data || [];

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'fixed_interval': return 'Interval';
      case 'count_based': return 'Count';
      case 'specific_times': return 'Specific';
      default: return 'Custom';
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-gray-900">Reminders</Text>
        <Link href="/(app)/reminders/create" asChild>
          <TouchableOpacity
            className="bg-primary-500 rounded-full w-12 h-12 items-center justify-center"
            accessibilityLabel="Add new reminder"
            accessibilityRole="button"
          >
            <Text className="text-white text-2xl font-light">+</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Loading...</Text>
        </View>
      ) : schedules.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-4">⏰</Text>
          <Text className="text-xl font-semibold text-gray-700 mb-2">No reminders yet</Text>
          <Text className="text-gray-500 text-center mb-6">
            Create your first medication reminder to never miss a dose.
          </Text>
          <Link href="/(app)/reminders/create" asChild>
            <TouchableOpacity
              className="bg-primary-500 rounded-xl py-4 px-8 min-h-[52px] items-center"
              accessibilityLabel="Create first reminder"
              accessibilityRole="button"
            >
              <Text className="text-white text-lg font-semibold">Add Reminder</Text>
            </TouchableOpacity>
          </Link>
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-6 pb-6"
          onRefresh={refetch}
          refreshing={isLoading}
          renderItem={({ item }) => (
            <View className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    {item.customMedicationName || 'Medication'}
                  </Text>
                  {item.dosageText && (
                    <Text className="text-sm text-gray-500 mt-1">{item.dosageText}</Text>
                  )}
                </View>
                <View className="bg-primary-50 rounded-full px-3 py-1">
                  <Text className="text-xs text-primary-500 font-medium">
                    {getModeLabel(item.schedulingMode)}
                  </Text>
                </View>
              </View>
              <View className="flex-row mt-3 gap-4">
                {item.allowDndOverride && (
                  <Text className="text-xs text-gray-400">DND Override</Text>
                )}
                <Text className="text-xs text-gray-400">
                  Snooze: {item.snoozeLimit}x / {item.snoozeIntervalMinutes}min
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
