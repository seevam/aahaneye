import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { colors } from '@/constants/theme';

export default function AppLayout() {
  const { isAuthenticated, isGuest, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (!isAuthenticated && !isGuest) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { paddingBottom: 8, height: 60 },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>💊</Text>,
          tabBarAccessibilityLabel: "Today's reminders",
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>⏰</Text>,
          tabBarAccessibilityLabel: 'Manage reminders',
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: 'Stories',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>📖</Text>,
          tabBarAccessibilityLabel: 'Eye care stories',
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>📊</Text>,
          tabBarAccessibilityLabel: 'Adherence reports',
          href: isGuest ? null : undefined, // Hide for guests
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>👤</Text>,
          tabBarAccessibilityLabel: 'Profile settings',
          href: isGuest ? null : undefined,
        }}
      />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
    </Tabs>
  );
}
