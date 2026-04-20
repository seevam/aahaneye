import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { apiClient } from '@/services/api-client';
import { usePatientStore } from '@/stores/patient-store';
import type { ApiResponse } from '@eyecare/shared';

type TimeRange = '7d' | '30d';

interface AdherenceReport {
  overall: {
    total: number;
    taken: number;
    missed: number;
    skipped: number;
    adherenceRate: number;
  };
  byMedication: Array<{
    medicationName: string;
    total: number;
    taken: number;
    missed: number;
    skipped: number;
    adherenceRate: number;
    lastMissed: string | null;
  }>;
  period: { startDate: string; endDate: string };
}

export default function ReportsScreen() {
  const [range, setRange] = useState<TimeRange>('7d');
  const activePatientId = usePatientStore((s) => s.activePatientId);

  const dateRange = useMemo(() => {
    const end = format(new Date(), 'yyyy-MM-dd');
    const start = format(subDays(new Date(), range === '7d' ? 7 : 30), 'yyyy-MM-dd');
    return { start, end };
  }, [range]);

  const { data, isLoading } = useQuery({
    queryKey: ['adherenceReport', activePatientId, range],
    queryFn: () =>
      apiClient<ApiResponse<AdherenceReport>>(
        `/patients/${activePatientId}/reports/adherence?startDate=${dateRange.start}&endDate=${dateRange.end}`,
      ),
    enabled: !!activePatientId,
  });

  const report = data?.data;

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <View className="flex-1 bg-gray-50 px-6 pt-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">Adherence Report</Text>

      {/* Time range toggle */}
      <View className="flex-row bg-gray-200 rounded-xl p-1 mb-6">
        {(['7d', '30d'] as const).map((r) => (
          <TouchableOpacity
            key={r}
            className={`flex-1 py-3 rounded-lg items-center min-h-[44px] justify-center ${
              range === r ? 'bg-white' : ''
            }`}
            onPress={() => setRange(r)}
            accessibilityLabel={`Show ${r === '7d' ? 'last 7 days' : 'last 30 days'}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: range === r }}
          >
            <Text className={`font-medium ${range === r ? 'text-gray-900' : 'text-gray-500'}`}>
              {r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overall adherence */}
      <View className="bg-white rounded-2xl p-6 items-center mb-6 border border-gray-100">
        <Text className={`text-5xl font-bold ${getAdherenceColor(report?.overall.adherenceRate || 0)}`}>
          {report?.overall.adherenceRate || 0}%
        </Text>
        <Text className="text-gray-500 mt-2">Overall Adherence</Text>
        {report && (
          <View className="flex-row mt-4 gap-6">
            <View className="items-center">
              <Text className="text-lg font-semibold text-green-600">{report.overall.taken}</Text>
              <Text className="text-xs text-gray-400">Taken</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-semibold text-red-500">{report.overall.missed}</Text>
              <Text className="text-xs text-gray-400">Missed</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-semibold text-gray-400">{report.overall.skipped}</Text>
              <Text className="text-xs text-gray-400">Skipped</Text>
            </View>
          </View>
        )}
      </View>

      {/* Per medication */}
      {report?.byMedication && report.byMedication.length > 0 ? (
        <FlatList
          data={report.byMedication}
          keyExtractor={(item) => item.medicationName}
          renderItem={({ item }) => (
            <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-semibold text-gray-900">{item.medicationName}</Text>
                <Text className={`text-lg font-bold ${getAdherenceColor(item.adherenceRate)}`}>
                  {item.adherenceRate}%
                </Text>
              </View>
              <View className="flex-row mt-2 gap-4">
                <Text className="text-xs text-gray-400">
                  {item.taken}/{item.total} taken
                </Text>
                {item.missed > 0 && (
                  <Text className="text-xs text-red-400">{item.missed} missed</Text>
                )}
              </View>
            </View>
          )}
        />
      ) : (
        <View className="bg-white rounded-2xl p-6 border border-gray-100">
          <Text className="text-base font-semibold text-gray-700 mb-2">Per Medication</Text>
          <Text className="text-sm text-gray-400">
            Medication adherence data will appear here once you start tracking reminders.
          </Text>
        </View>
      )}
    </View>
  );
}
