import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useOrdersStore } from '../stores';
import type { OrderNotificationDTO } from '../types/api';

const assignmentSound = require('../../assets/sound/newOrder.mp3');

const SHEET_HEIGHT = moderateScale(240);

interface DriverAssignmentOverlayProps {
  onViewOrder?: (order: OrderNotificationDTO) => void;
}

export const DriverAssignmentOverlay: React.FC<DriverAssignmentOverlayProps> = ({
  onViewOrder,
}) => {
  const assignment = useOrdersStore((state) => state.activeDriverAssignment);
  const clearAssignment = useOrdersStore((state) => state.clearDriverAssignment);
  const [isMounted, setIsMounted] = useState(false);
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  const driverName = useMemo(() => assignment?.delivery?.driver?.name ?? 'A driver', [assignment]);
  const orderNumber = useMemo(() => (assignment ? `#${assignment.orderId}` : ''), [assignment]);

  const stopSound = useCallback(async () => {
    const current = soundRef.current;
    soundRef.current = null;

    if (!current) {
      return;
    }

    try {
      await current.stopAsync();
    } catch (error) {
      // best effort stop
    }

    try {
      await current.unloadAsync();
    } catch (error) {
      // ignore unload issues
    }
  }, []);

  const playSound = useCallback(async () => {
    try {
      await stopSound();
      const { sound } = await Audio.Sound.createAsync(assignmentSound, {
        shouldPlay: true,
        isLooping: false,
      });

      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.warn('Failed to play driver assignment sound', error);
    }
  }, [stopSound]);

  const animateIn = useCallback(() => {
    setIsMounted(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.4,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, translateY]);

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsMounted(false);
      }
    });
  }, [backdropOpacity, translateY]);

  useEffect(() => {
    if (assignment) {
      animateIn();
      void playSound();
      return;
    }

    if (isMounted) {
      animateOut();
    }
  }, [animateIn, animateOut, assignment, isMounted, playSound]);

  useEffect(() => {
    if (!assignment) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      clearAssignment();
    }, 12000);

    return () => clearTimeout(timeout);
  }, [assignment, clearAssignment]);

  useEffect(() => {
    return () => {
      void stopSound();
    };
  }, [stopSound]);

  const handleDismiss = useCallback(() => {
    clearAssignment();
  }, [clearAssignment]);

  const handleViewOrder = useCallback(() => {
    if (!assignment) {
      return;
    }

    onViewOrder?.(assignment);
    clearAssignment();
  }, [assignment, clearAssignment, onViewOrder]);

  if (!assignment && !isMounted) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents={assignment ? 'auto' : 'none'}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      />
      <Animated.View
        pointerEvents="box-none"
        style={[styles.sheetContainer, { transform: [{ translateY }] }]}
      >
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>Driver assigned</Text>
          <Text style={styles.subtitle}>
            {driverName} is gearing up to collect order {orderNumber}.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Driver</Text>
            <Text style={styles.infoValue}>{assignment?.delivery?.driver?.name ?? 'To be announced'}</Text>
            {assignment?.delivery?.driver?.phone ? (
              <Text style={styles.infoDetail}>☎ {assignment.delivery.driver.phone}</Text>
            ) : null}
            {assignment?.delivery?.estimatedPickupTime ? (
              <Text style={styles.infoDetail}>
                ETA pick-up: ~{Math.round(assignment.delivery.estimatedPickupTime)} min
              </Text>
            ) : null}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleDismiss}>
              <Text style={[styles.actionLabel, styles.secondaryLabel]}>Dismiss</Text>
            </TouchableOpacity>
            <View style={styles.buttonSpacer} />
            <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={handleViewOrder}>
              <Text style={[styles.actionLabel, styles.primaryLabel]}>View order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.navy,
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -2,
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(24),
  },
  sheet: {
    borderRadius: moderateScale(28),
    backgroundColor: colors.white,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(18),
    paddingBottom: moderateScale(24),
    shadowColor: colors.navy,
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(24),
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  grabber: {
    alignSelf: 'center',
    width: moderateScale(56),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: '#E4E8F0',
    marginBottom: moderateScale(16),
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    color: colors.navy,
  },
  subtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: moderateScale(8),
    marginBottom: moderateScale(18),
  },
  infoCard: {
    borderRadius: moderateScale(20),
    backgroundColor: '#F3F6FB',
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(16),
    marginBottom: moderateScale(20),
  },
  infoLabel: {
    ...typography.bodyStrong,
    color: colors.navy,
    marginBottom: moderateScale(4),
  },
  infoValue: {
    ...typography.bodyStrong,
    fontSize: moderateScale(18),
    color: colors.primary,
  },
  infoDetail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: moderateScale(6),
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    borderRadius: moderateScale(18),
    paddingVertical: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryLabel: {
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryLabel: {
    color: colors.primary,
  },
  actionLabel: {
    ...typography.bodyStrong,
    textTransform: 'uppercase',
  },
  buttonSpacer: {
    width: moderateScale(12),
  },
});

