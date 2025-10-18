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

export const IncomingOrdersOverlay: React.FC = () => {
  const activeAlert = useOrdersStore((state) => state.activeAlert);
  const queuedAlerts = useOrdersStore((state) => state.queuedAlerts);
  const removeAlert = useOrdersStore((state) => state.removeAlert);
  const bumpActiveOrdersRefreshToken = useOrdersStore(
    (state) => state.bumpActiveOrdersRefreshToken
  );

  const alerts = useMemo(() => {
    if (!activeAlert) {
      return [] as OrderNotificationDTO[];
    }

    return [activeAlert, ...queuedAlerts];
  }, [activeAlert, queuedAlerts]);

  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  useEffect(() => {
    setSelectedIndex((prev) => {
      if (alerts.length === 0) {
        return 0;
      }

      return Math.min(prev, alerts.length - 1);
    });
  }, [alerts.length]);

  useEffect(() => {
    if (alerts.length === 0) {
      return;
    }

    setSelectedIndex(0);
  }, [alerts[0]?.orderId, alerts.length]);

  const handleSelectPrevious = useCallback(() => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSelectNext = useCallback(() => {
    setSelectedIndex((prev) => Math.min(prev + 1, alerts.length - 1));
  }, [alerts.length]);

  const handleAccept = useCallback(
    async (order: OrderNotificationDTO) => {
      if (processingOrderId !== null) {
        return;
      }

      setProcessingOrderId(order.orderId);

      try {
        await restaurantApi.acceptOrder(order.orderId);
        removeAlert(order.orderId);
        bumpActiveOrdersRefreshToken();
      } catch (error) {
        Alert.alert('Unable to accept order', 'Please try again in a moment.');
      } finally {
        setProcessingOrderId(null);
      }
    },
    [bumpActiveOrdersRefreshToken, processingOrderId, removeAlert]
  );

  const handleDecline = useCallback(
    async (order: OrderNotificationDTO) => {
      if (processingOrderId !== null) {
        return;
      }

      setProcessingOrderId(order.orderId);

      try {
        await restaurantApi.rejectOrder(order.orderId);
        removeAlert(order.orderId);
      } catch (error) {
        Alert.alert('Unable to decline order', 'Please try again in a moment.');
      } finally {
        setProcessingOrderId(null);
      }
    },
    [processingOrderId, removeAlert]
  );

  if (alerts.length === 0) {
    return null;
  }

  const displayedAlert = alerts[selectedIndex];
  const canGoPrevious = selectedIndex > 0 && processingOrderId === null;
  const canGoNext = selectedIndex < alerts.length - 1 && processingOrderId === null;

  return (
    <View pointerEvents="auto" style={styles.overlayContainer}>
      <View pointerEvents="none" style={styles.backdrop} />
      <View style={styles.cardWrapper}>
        <IncomingOrderCard
          order={displayedAlert}
          isProcessing={processingOrderId === displayedAlert.orderId}
          onAccept={() => handleAccept(displayedAlert)}
          onDecline={() => handleDecline(displayedAlert)}
          insets={insets}
          currentIndex={selectedIndex}
          total={alerts.length}
          onGoPrevious={handleSelectPrevious}
          onGoNext={handleSelectNext}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
        />
      </View>
    </View>
  );
};

type IncomingOrderCardProps = {
  order: OrderNotificationDTO;
  isProcessing: boolean;
  onAccept: () => void;
  onDecline: () => void;
  insets: EdgeInsets;
  currentIndex: number;
  total: number;
  onGoPrevious: () => void;
  onGoNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
};

const IncomingOrderCard: React.FC<IncomingOrderCardProps> = ({
  order,
  isProcessing,
  onAccept,
  onDecline,
  insets,
  currentIndex,
  total,
  onGoPrevious,
  onGoNext,
  canGoPrevious,
  canGoNext,
}) => {
  const itemSummaries = useMemo(() => formatOrderItems(order), [order]);
  const contentStyle = useMemo<StyleProp<ViewStyle>>(
    () => [
      styles.cardContent,
      {
        paddingTop: moderateScale(24) + insets.top,
        paddingBottom: moderateScale(24) + Math.max(insets.bottom, moderateScale(24)),
      },
    ],
    [insets.bottom, insets.top]
  );

  return (
    <View style={[styles.card, styles.fullScreenCard]}>
      <ScrollView
        style={styles.cardScroll}
        contentContainerStyle={contentStyle}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {total > 1 && (
          <View style={styles.navigationRow}>
            <TouchableOpacity
              onPress={onGoPrevious}
              style={[styles.navigationButton, !canGoPrevious && styles.disabledNavButton]}
              disabled={!canGoPrevious}
            >
              <Text style={styles.navigationLabel}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.navigationCounter}>{`${currentIndex + 1} of ${total}`}</Text>
            <TouchableOpacity
              onPress={onGoNext}
              style={[styles.navigationButton, !canGoNext && styles.disabledNavButton]}
              disabled={!canGoNext}
            >
              <Text style={styles.navigationLabel}>›</Text>
            </TouchableOpacity>
          </View>
        )}
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

        <View style={[styles.actionsRow, styles.fullScreenActionsRow]}>
          <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={onDecline}>
            <Text style={[styles.actionLabel, styles.declineLabel]}>
              Decline <Text style={styles.symbol}>✕</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton, isProcessing && styles.disabledButton]}
            onPress={onAccept}
            disabled={isProcessing}
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
    top: 0,
    bottom: 0,
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
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: moderateScale(16),
  },
  navigationButton: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  disabledNavButton: {
    opacity: 0.4,
  },
  navigationLabel: {
    ...typography.h2,
    color: colors.primary,
  },
  navigationCounter: {
    ...typography.bodyStrong,
    textTransform: 'uppercase',
    color: colors.textPrimary,
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

