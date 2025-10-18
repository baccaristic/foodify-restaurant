import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useOrdersStore } from '../stores';
import type { OrderNotificationDTO } from '../types/api';
import { restaurantApi } from '../api/restaurantApi';

const bellImage = require('../../assets/bell.png');
const alertSound = require('../../assets/sound/newOrder.mp3');

const MAX_VISIBLE_ALERTS = 3;

export const IncomingOrdersOverlay: React.FC = () => {
  const activeAlert = useOrdersStore((state) => state.activeAlert);
  const queuedAlerts = useOrdersStore((state) => state.queuedAlerts);
  const clearActiveAlert = useOrdersStore((state) => state.clearActiveAlert);

  const alerts = useMemo(() => {
    if (!activeAlert) {
      return [] as OrderNotificationDTO[];
    }

    return [activeAlert, ...queuedAlerts];
  }, [activeAlert, queuedAlerts]);

  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);
  const insets = useSafeAreaInsets();
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
      // Stopping playback may throw if sound already finished.
    }

    try {
      await current.unloadAsync();
    } catch (error) {
      // Unloading failure should not block UI flow.
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const ensureSound = async () => {
      const currentAlert = alerts[0];

      if (!currentAlert) {
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

    void ensureSound();

    return () => {
      isMounted = false;
      void stopAlertSound();
    };
  }, [alerts, stopAlertSound]);

  const handleClearTopAlert = useCallback(() => {
    if (processingOrderId !== null) {
      return;
    }

    clearActiveAlert();
  }, [clearActiveAlert, processingOrderId]);

  const handleAccept = useCallback(
    async (order: OrderNotificationDTO) => {
      if (processingOrderId !== null) {
        return;
      }

      setProcessingOrderId(order.orderId);

      try {
        await restaurantApi.acceptOrder(order.orderId);
        clearActiveAlert();
      } catch (error) {
        Alert.alert('Unable to accept order', 'Please try again in a moment.');
      } finally {
        setProcessingOrderId(null);
      }
    },
    [clearActiveAlert, processingOrderId]
  );

  if (alerts.length === 0) {
    return null;
  }

  return (
    <View pointerEvents="auto" style={styles.overlayContainer}>
      <View pointerEvents="none" style={styles.backdrop} />
      {alerts.slice(0, MAX_VISIBLE_ALERTS).map((alert, index) => {
        const topOffset = Math.max(insets.top, moderateScale(16)) + moderateScale(16) + index * moderateScale(16);
        const scale = 1 - index * 0.04;
        const opacity = index === 0 ? 1 : 0.85 - index * 0.05;
        const isTop = index === 0;

        return (
          <View
            key={`${alert.orderId}-${index}`}
            pointerEvents={isTop ? 'auto' : 'none'}
            style={[
              styles.cardWrapper,
              isTop ? styles.topCardWrapper : { top: topOffset },
              {
                transform: [{ scale }],
                opacity,
              },
            ]}
          >
            <IncomingOrderCard
              order={alert}
              isProcessing={processingOrderId === alert.orderId}
              onAccept={() => handleAccept(alert)}
              onDecline={handleClearTopAlert}
              isTop={isTop}
              insets={insets}
            />
          </View>
        );
      })}
    </View>
  );
};

type IncomingOrderCardProps = {
  order: OrderNotificationDTO;
  isProcessing: boolean;
  onAccept: () => void;
  onDecline: () => void;
  isTop: boolean;
  insets: EdgeInsets;
};

const IncomingOrderCard: React.FC<IncomingOrderCardProps> = ({
  order,
  isProcessing,
  onAccept,
  onDecline,
  isTop,
  insets,
}) => {
  const itemSummaries = useMemo(() => formatOrderItems(order), [order]);
  const contentStyle = useMemo<StyleProp<ViewStyle>>(() => {
    if (!isTop) {
      return styles.cardContent;
    }

    return [
      styles.cardContent,
      {
        paddingTop: moderateScale(24) + insets.top,
        paddingBottom: moderateScale(24) + Math.max(insets.bottom, moderateScale(24)),
      },
    ];
  }, [insets.bottom, insets.top, isTop]);
  const actionsRowStyle = useMemo<StyleProp<ViewStyle>>(
    () => (isTop ? [styles.actionsRow, styles.fullScreenActionsRow] : styles.actionsRow),
    [isTop]
  );

  return (
    <View
      style={[
        styles.card,
        isTop ? styles.fullScreenCard : styles.stackedCard,
        !isTop && styles.mutedCard,
      ]}
    >
      <ScrollView
        style={styles.cardScroll}
        contentContainerStyle={contentStyle}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
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

        <View style={actionsRowStyle}>
          <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={onDecline}>
            <Text style={[styles.actionLabel, styles.declineLabel]}>
              Decline <Text style={styles.symbol}>✕</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, (isProcessing || !isTop) && styles.disabledButton]}
            onPress={onAccept}
            disabled={isProcessing || !isTop}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.actionLabel}>
                Accept <Text style={styles.symbol}>✓</Text>
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const formatOrderItems = (order: OrderNotificationDTO): string[] => {
  return order.items.map((item) => `${item.quantity} x ${item.menuItemName.toUpperCase()}`);
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  cardWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: moderateScale(24),
  },
  topCardWrapper: {
    top: 0,
    bottom: 0,
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(16),
    shadowOffset: { width: 0, height: moderateScale(4) },
    elevation: 8,
  },
  fullScreenCard: {
    flex: 1,
    borderRadius: 0,
  },
  stackedCard: {
    borderRadius: moderateScale(20),
    maxHeight: '80%',
  },
  mutedCard: {
    opacity: 0.9,
  },
  cardContent: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(24),
    paddingTop: moderateScale(24),
    paddingBottom: moderateScale(24),
    alignItems: 'center',
    gap: moderateScale(24),
  },
  cardScroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  restaurantName: {
    ...typography.h3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    gap: moderateScale(12),
  },
  bell: {
    width: moderateScale(140),
    height: moderateScale(140),
  },
  title: {
    ...typography.h2,
    textTransform: 'uppercase',
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
    alignSelf: 'stretch',
  },
  fullScreenActionsRow: {
    marginTop: 'auto',
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

