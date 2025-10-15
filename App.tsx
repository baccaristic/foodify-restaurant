import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { useAuthStore } from './src/store/authStore';
import { colors } from './src/theme/colors';

const AppContent: React.FC = () => {
  const { user, isHydrating, hydrate } = useAuthStore((state) => ({
    user: state.user,
    isHydrating: state.isHydrating,
    hydrate: state.hydrate,
  }));

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (isHydrating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user) {
    return <DashboardScreen />;
  }

  return <LoginScreen />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
