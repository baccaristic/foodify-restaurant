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
import { DriverAssignmentOverlay } from '../components/DriverAssignmentOverlay';
import { MenuScreen } from '../screens/MenuScreen';
import { AddDishScreen } from '../screens/AddDishScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const navigationRef = useRef(createNavigationContainerRef<RootStackParamList>()).current;
  const [isNavigationReady, setNavigationReady] = useState(false);

  const navigatorKey = isAuthenticated ? 'authenticated' : 'unauthenticated';

  const pushAlert = useOrdersStore((state) => state.pushAlert);
  const pushDriverAssignment = useOrdersStore((state) => state.pushDriverAssignment);
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

  const handleOrderUpdate = useCallback(
    (order: OrderNotificationDTO) => {
      const history = order.statusHistory ?? [];
      const latestChange = history[history.length - 1];

      if (latestChange?.previousStatus === 'ACCEPTED' && latestChange.newStatus === 'PREPARING') {
        pushDriverAssignment(order);
      }
    },
    [pushDriverAssignment]
  );

  const handleViewAssignedOrder = useCallback(
    (order: OrderNotificationDTO) => {
      if (!navigationRef.isReady()) {
        return;
      }

      navigationRef.navigate('OrderDetails', { order });
    },
    [navigationRef]
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
        onOrderUpdate: handleOrderUpdate,
      });
      return () => {
        void disconnectRealtime();
      };
    }

    void disconnectRealtime();
    resetAlerts();
  }, [handleNewOrder, handleOrderUpdate, isAuthenticated, isHydrated, resetAlerts]);

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
      <View style={styles.appRoot}>
        <Stack.Navigator key={navigatorKey} screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Menu" component={MenuScreen} />
              <Stack.Screen name="AddDish" component={AddDishScreen} />
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
        <DriverAssignmentOverlay onViewOrder={handleViewAssignedOrder} />
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
  },
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
