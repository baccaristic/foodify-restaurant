import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';
import { useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { RootStackParamList } from '../navigation';
import { restaurantApi } from '../api/restaurantApi';
import type { OrderNotificationDTO, OrderItemDTO } from '../types/api';

const backgroundImage = require('../../assets/background.png');

const formatCurrency = (value: number): string => {
  return `${value.toFixed(3).replace('.', ',')} DT`;
};

const getItemExtrasLabel = (item: OrderItemDTO): string | null => {
  if (item.extras.length === 0) {
    return null;
  }

  return item.extras.join(', ');
};

const getSpecialInstructions = (items: OrderItemDTO[]): string[] =>
  items
    .map((item) => item.specialInstructions?.trim())
    .filter((instruction): instruction is string => Boolean(instruction));

type OrderDetailsRouteProp = { params: RootStackParamList['OrderDetails'] };

export const OrderDetailsScreen: React.FC = () => {
  const route = useRoute<OrderDetailsRouteProp>();
  const [order, setOrder] = useState<OrderNotificationDTO>(route.params.order);
  const [isMarkingReady, setIsMarkingReady] = useState(false);

  const isPreparing = order.status === 'PREPARING';
  const isReadyForPickup = order.status === 'READY_FOR_PICK_UP';

  const customerNotes = useMemo(() => getSpecialInstructions(order.items), [order.items]);

  const handleMarkReady = useCallback(async () => {
    setIsMarkingReady(true);

    try {
      const updatedOrder = await restaurantApi.markOrderReady(order.orderId);
      setOrder(updatedOrder);
      Alert.alert('Order ready', 'The order is now ready for pickup.');
    } catch (error) {
      Alert.alert('Unable to mark as ready', 'Please try again in a moment.');
    } finally {
      setIsMarkingReady(false);
    }
  }, [order.orderId]);

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <View style={styles.overlayContainer}>
        <View pointerEvents="none" style={styles.tintOverlay} />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Text style={typography.h2}>{`Order N°${order.orderId}`}</Text>
              <View style={styles.headerTotalContainer}>
                <Text style={styles.headerTotalLabel}>TOTAL</Text>
                <Text style={styles.headerTotalValue}>{formatCurrency(order.payment.total)}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              {order.items.map((item, index) => {
                const extrasLabel = getItemExtrasLabel(item);
                const extrasTotal = item.extrasTotal > 0 ? `+${formatCurrency(item.extrasTotal)}` : null;

                return (
                  <View key={`${item.menuItemId}-${index}`} style={styles.orderItem}>
                    <View style={styles.orderItemHeader}>
                      <Text style={styles.orderItemTitle}>{`${item.quantity}x ${item.menuItemName}`}</Text>
                      <Text style={styles.orderItemPrice}>{formatCurrency(item.lineTotal)}</Text>
                    </View>
                    {extrasLabel ? (
                      <View style={styles.orderItemExtrasRow}>
                        <Text style={styles.orderItemExtrasLabel}>{extrasLabel}</Text>
                        {extrasTotal ? (
                          <Text style={styles.orderItemExtrasPrice}>{extrasTotal}</Text>
                        ) : null}
                      </View>
                    ) : null}
                    {item.specialInstructions ? (
                      <Text style={styles.orderItemNote}>{item.specialInstructions}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer</Text>
              <Text style={styles.customerName}>{order.client.name}</Text>
              <Text style={styles.customerAddress}>{order.deliveryAddress}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              {customerNotes.length > 0 ? (
                customerNotes.map((note, index) => (
                  <Text key={`${note}-${index}`} style={styles.noteText}>
                    {note}
                  </Text>
                ))
              ) : (
                <Text style={styles.notePlaceholder}>No special instructions.</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.actionsContainer}>
            {isPreparing ? (
              <TouchableOpacity
                onPress={handleMarkReady}
                style={styles.markReadyButton}
                activeOpacity={0.85}
                disabled={isMarkingReady}
              >
                {isMarkingReady ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={typography.button}>Mark as ready</Text>
                )}
              </TouchableOpacity>
            ) : null}

            {isReadyForPickup ? (
              <TouchableOpacity
                onPress={() => Alert.alert('QR Code', 'Show the pickup QR code to the driver.')}
                style={styles.qrButton}
                activeOpacity={0.85}
              >
                <Text style={styles.qrButtonText}>QR CODE</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlayContainer: {
    flex: 1,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: moderateScale(20),
    paddingBottom: moderateScale(120),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: moderateScale(24),
  },
  headerTotalContainer: {
    alignItems: 'flex-end',
  },
  headerTotalLabel: {
    ...typography.captionStrong,
    color: colors.primary,
    marginBottom: moderateScale(4),
  },
  headerTotalValue: {
    ...typography.h3,
    color: colors.primary,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: moderateScale(12),
  },
  orderItem: {
    marginBottom: moderateScale(12),
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemTitle: {
    ...typography.bodyStrong,
  },
  orderItemPrice: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  orderItemExtrasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(4),
  },
  orderItemExtrasLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    flex: 1,
    marginRight: moderateScale(8),
  },
  orderItemExtrasPrice: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  orderItemNote: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: moderateScale(6),
  },
  customerName: {
    ...typography.bodyStrong,
    marginBottom: moderateScale(4),
  },
  customerAddress: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  noteText: {
    ...typography.bodyMedium,
    marginBottom: moderateScale(4),
  },
  notePlaceholder: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  actionsContainer: {
    position: 'absolute',
    left: moderateScale(20),
    right: moderateScale(20),
    bottom: moderateScale(24),
  },
  markReadyButton: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButton: {
    marginTop: moderateScale(12),
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  qrButtonText: {
    ...typography.button,
    color: colors.primary,
  },
});
