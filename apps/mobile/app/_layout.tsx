import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { setupNotificationChannels, setupIOSCategories } from '@/services/notification-service';
import { registerNotificationHandlers } from '@/services/notification-handler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

// Register notification handlers at module level (required for background events)
registerNotificationHandlers();

export default function RootLayout() {
  const loadSession = useAuthStore((s) => s.loadSession);

  useEffect(() => {
    loadSession();
    // Set up notification channels and categories
    setupNotificationChannels();
    setupIOSCategories();
  }, [loadSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen
          name="alarm"
          options={{
            presentation: 'fullScreenModal',
            gestureEnabled: false,
            animation: 'none',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
