import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

const REMINDERS = [
  { id: '1', name: 'Latanoprost Eye Drops', time: '8:00 AM', status: 'taken' },
  { id: '2', name: 'Dorzolamide', time: '12:00 PM', status: 'pending' },
  { id: '3', name: 'Timolol Eye Drops', time: '6:00 PM', status: 'pending' },
];

const STATUS_STYLES: Record<string, { bg: string; label: string; icon: string }> = {
  taken:   { bg: 'bg-green-50 border-green-200',  label: 'Taken',   icon: '✓' },
  missed:  { bg: 'bg-red-50 border-red-200',      label: 'Missed',  icon: '✕' },
  pending: { bg: 'bg-blue-50 border-blue-200',    label: 'Pending', icon: '○' },
};

export default function DashboardScreen() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-10">
      {/* Header card */}
      <View className="bg-blue-500 px-6 pt-6 pb-8">
        <Text className="text-blue-100 text-sm mb-1">{today}</Text>
        <Text className="text-white text-2xl font-bold mb-4">Good morning, Ahaan 👋</Text>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-white/20 rounded-2xl p-4">
            <Text className="text-white text-2xl font-bold">1/3</Text>
            <Text className="text-blue-100 text-xs mt-1">Doses taken</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-2xl p-4">
            <Text className="text-white text-2xl font-bold">33%</Text>
            <Text className="text-blue-100 text-xs mt-1">Today&apos;s adherence</Text>
          </View>
        </View>
      </View>

      {/* Today's reminders */}
      <View className="px-6 pt-6">
        <Text className="text-lg font-bold text-gray-900 mb-4">Today&apos;s Schedule</Text>

        {REMINDERS.map((item) => {
          const s = STATUS_STYLES[item.status] ?? STATUS_STYLES.pending;
          return (
            <View key={item.id} className={`border rounded-2xl p-4 mb-3 ${s.bg}`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
                  <Text className="text-sm text-gray-500 mt-0.5">{item.time}</Text>
                </View>
                <View className="items-center ml-3">
                  <Text className="text-xl">{s.icon}</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">{s.label}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Quick actions */}
      <View className="px-6 pt-4">
        <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity className="flex-1 bg-white border border-gray-200 rounded-2xl p-4 items-center">
            <Text className="text-2xl mb-2">➕</Text>
            <Text className="text-sm font-medium text-gray-700">Add Reminder</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-white border border-gray-200 rounded-2xl p-4 items-center">
            <Text className="text-2xl mb-2">📊</Text>
            <Text className="text-sm font-medium text-gray-700">View Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
