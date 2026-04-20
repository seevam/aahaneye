import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Vibration } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { colors, alarmButtonSize } from '@/constants/theme';

export default function AlarmScreen() {
  const params = useLocalSearchParams<{
    instanceId: string;
    medicationName: string;
    dosageText: string;
    snoozeCount: string;
    snoozeLimit: string;
    snoozeIntervalMinutes: string;
  }>();

  const [currentTime, setCurrentTime] = useState(new Date());
  const snoozeCount = parseInt(params.snoozeCount || '0', 10);
  const snoozeLimit = parseInt(params.snoozeLimit || '3', 10);
  const canSnooze = snoozeCount < snoozeLimit;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    // Start vibration pattern
    Vibration.vibrate([0, 1000, 500, 1000, 500, 1000], true);
    return () => {
      clearInterval(timer);
      Vibration.cancel();
    };
  }, []);

  const handleTaken = async () => {
    Vibration.cancel();
    // TODO: update instance status via API/local DB
    // TODO: cancel notification
    router.dismiss();
  };

  const handleSnooze = async () => {
    Vibration.cancel();
    // TODO: schedule new notification for now + snoozeInterval
    // TODO: update instance status to 'snoozed'
    router.dismiss();
  };

  const handleSkip = async () => {
    Vibration.cancel();
    // TODO: update instance status to 'skipped'
    // TODO: cancel notification
    router.dismiss();
  };

  return (
    <View className="flex-1 bg-gray-900 items-center justify-center px-8">
      {/* Current time */}
      <Text className="text-white text-lg mb-8 opacity-60">
        {format(currentTime, 'h:mm:ss a')}
      </Text>

      {/* Medication image placeholder */}
      <View className="w-32 h-32 rounded-full bg-primary-500 items-center justify-center mb-6">
        <Text className="text-5xl">💧</Text>
      </View>

      {/* Medication info */}
      <Text className="text-white text-3xl font-bold text-center mb-2">
        {params.medicationName || 'Medication'}
      </Text>
      <Text className="text-white text-xl opacity-80 text-center mb-12">
        {params.dosageText || 'Take your dose'}
      </Text>

      {/* Tip */}
      <Text className="text-white text-sm opacity-40 text-center mb-12 italic">
        Keep your eye closed for 2 minutes after instilling drops.
      </Text>

      {/* Action buttons — huge, accessible */}
      <TouchableOpacity
        style={{
          backgroundColor: colors.success,
          width: '100%',
          minHeight: alarmButtonSize,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
        onPress={handleTaken}
        accessibilityLabel="Mark as taken"
        accessibilityRole="button"
        accessibilityHint="Marks this medication dose as taken"
      >
        <Text className="text-white text-2xl font-bold">TAKEN</Text>
      </TouchableOpacity>

      {canSnooze && (
        <TouchableOpacity
          style={{
            backgroundColor: colors.warning,
            width: '100%',
            minHeight: alarmButtonSize,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
          onPress={handleSnooze}
          accessibilityLabel={`Snooze for ${params.snoozeIntervalMinutes || 10} minutes`}
          accessibilityRole="button"
        >
          <Text className="text-gray-900 text-2xl font-bold">
            SNOOZE {params.snoozeIntervalMinutes || 10}m
          </Text>
          <Text className="text-gray-700 text-sm">
            {snoozeCount}/{snoozeLimit} snoozes used
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={{
          backgroundColor: '#6b7280',
          width: '100%',
          minHeight: 60,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
        onPress={handleSkip}
        accessibilityLabel="Skip this dose"
        accessibilityRole="button"
      >
        <Text className="text-white text-xl font-semibold">SKIP</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="py-4 min-h-[44px] items-center"
        accessibilityLabel="Report a problem"
        accessibilityRole="button"
      >
        <Text className="text-white text-sm opacity-40 underline">Report Problem</Text>
      </TouchableOpacity>
    </View>
  );
}
