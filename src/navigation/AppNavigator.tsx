import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
  type NavigationContainerRef,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore, useOrdersStore } from '../stores';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { NewOrderAlertScreen } from '../screens/NewOrderAlertScreen';
import { colors } from '../theme/colors';
import { connectRealtime, disconnectRealtime } from '../realtime';
import type { RootStackParamList } from './types';
import type { OrderNotificationDTO } from '../types/api';
import { OrderDetailsScreen } from '../screens/OrderDetailsScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const navigationRef = useRef(createNavigationContainerRef<RootStackParamList>()).current;
  const [isNavigationReady, setNavigationReady] = useState(false);

  const navigatorKey = isAuthenticated ? 'authenticated' : 'unauthenticated';

  const pushAlert = useOrdersStore((state) => state.pushAlert);
  const resetAlerts = useOrdersStore((state) => state.resetAlerts);

  const handleNewOrder = useCallback(
    (order: OrderNotificationDTO) => {
      pushAlert(order);
      if (navigationRef.isReady()) {
        navigationRef.navigate('NewOrderAlert');
      }
    },
    [navigationRef, pushAlert]
  );

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (isAuthenticated) {
      connectRealtime({
        onNewOrder: handleNewOrder,
      });
      return () => {
        void disconnectRealtime();
      };
    }

    void disconnectRealtime();
    resetAlerts();
  }, [handleNewOrder, isAuthenticated, isHydrated, resetAlerts]);

  useEffect(() => {
    if (!isHydrated || !isNavigationReady || !navigationRef.isReady()) {
      return;
    }

    const targetRoute: keyof RootStackParamList = isAuthenticated ? 'Dashboard' : 'Login';
    const currentRoute = navigationRef.getCurrentRoute();

    if (currentRoute?.name !== targetRoute) {
      navigationRef.reset({ index: 0, routes: [{ name: targetRoute }] });
    }
  }, [isAuthenticated, isHydrated, isNavigationReady, navigationRef]);

  if (!isHydrated) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef as unknown as NavigationContainerRef<any>}
      onReady={() => setNavigationReady(true)}
    >
      <Stack.Navigator key={navigatorKey} screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen
              name="NewOrderAlert"
              component={NewOrderAlertScreen}
              options={{ presentation: 'transparentModal', cardStyle: styles.modalCard }}
            />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  modalCard: {
    backgroundColor: 'transparent',
  },
});
