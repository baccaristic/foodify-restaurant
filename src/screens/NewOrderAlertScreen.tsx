import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useOrdersStore } from '../stores';
import type { RootStackParamList } from '../navigation/types';
import type { OrderNotificationDTO } from '../types/api';
import { restaurantApi } from '../api/restaurantApi';

const bellImage = require('../../assets/bell.png');
const alertSound = require('../../assets/sound/newOrder.mp3');

export const NewOrderAlertScreen: React.FC = () => {
  const order = useOrdersStore((state) => state.activeAlert);
  const clearActiveAlert = useOrdersStore((state) => state.clearActiveAlert);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isAccepting, setIsAccepting] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const stopAlertSound = useCallback(async () => {
    const current = soundRef.current;
    if (!current) {
      return;
    }

    soundRef.current = null;

    try {
      await current.stopAsync();
    } catch (error) {
      // no-op: stopping may fail if playback already ended
    }

    try {
      await current.unloadAsync();
    } catch (error) {
      // no-op: unloading failure should not block UI flow
    }
  }, []);

  useEffect(() => {
    if (!order) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  }, [navigation, order]);

  useEffect(() => {
    let isMounted = true;

    const setupSound = async () => {
      if (!order) {
        await stopAlertSound();
        return;
      }

      try {
        await stopAlertSound();

        const { sound } = await Audio.Sound.createAsync(alertSound, {
          shouldPlay: true,
          isLooping: true,
        });

        soundRef.current = sound;

        if (!isMounted) {
          await stopAlertSound();
          return;
        }

        await sound.playAsync();
      } catch (error) {
        console.warn('Failed to play new order alert sound', error);
      }
    };

    void setupSound();

    return () => {
      isMounted = false;
      void stopAlertSound();
    };
  }, [order, stopAlertSound]);

  const handleDismiss = useCallback(() => {
    clearActiveAlert();
  }, [clearActiveAlert]);

  const handleAccept = useCallback(async () => {
    if (!order || isAccepting) {
      return;
    }

    setIsAccepting(true);
    try {
      await restaurantApi.acceptOrder(order.orderId);
      clearActiveAlert();
    } catch (error) {
      Alert.alert('Unable to accept order', 'Please try again in a moment.');
    } finally {
      setIsAccepting(false);
    }
  }, [clearActiveAlert, isAccepting, order]);

  const itemSummaries = useMemo(() => formatOrderItems(order), [order]);

  if (!order) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <Text style={styles.restaurantName}>{order.restaurant.name}</Text>

        <View style={styles.content}>
          <Image source={bellImage} style={styles.bell} resizeMode="contain" />
          <Text style={styles.title}>NEW ORDER</Text>

          <View style={styles.itemsContainer}>
            {itemSummaries.map((summary, index) => (
              <Text key={`${summary}-${index}`} style={styles.itemText}>
                {summary}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={handleDismiss}>
            <Text style={[styles.actionLabel, styles.declineLabel]}>
              Decline <Text style={styles.symbol}>✕</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, isAccepting && styles.disabledButton]}
            onPress={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionLabel}>
                Accept <Text style={styles.symbol}>✓</Text>
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const formatOrderItems = (order: OrderNotificationDTO | null): string[] => {
  if (!order) {
    return [];
  }

  return order.items.map((item) => `${item.quantity} x ${item.menuItemName.toUpperCase()}`);
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(32),
    paddingBottom: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restaurantName: {
    ...typography.h3,
    textTransform: 'uppercase',
    alignSelf: 'center',
  },
  content: {
    alignItems: 'center',
  },
  bell: {
    width: moderateScale(180),
    height: moderateScale(180),
    marginBottom: moderateScale(16),
  },
  title: {
    ...typography.h2,
    textTransform: 'uppercase',
    marginBottom: moderateScale(12),
  },
  itemsContainer: {
    alignItems: 'center',
    gap: moderateScale(4),
  },
  itemText: {
    ...typography.bodyStrong,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: moderateScale(16),
  },
  actionButton: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  declineButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionLabel: {
    ...typography.button,
    textTransform: 'uppercase',
  },
  declineLabel: {
    color: colors.primary,
  },
  symbol: {
    fontSize: typography.button.fontSize,
  },
});
