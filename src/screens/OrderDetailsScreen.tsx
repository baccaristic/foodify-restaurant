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
import { StatusBar } from 'expo-status-bar';
import { moderateScale } from 'react-native-size-matters';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { ArrowLeft, CandyOff, MessageCircleMore, QrCode } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { RootStackParamList } from '../navigation';
import { FooterNavigation } from '../components/FooterNavigation';
import { restaurantApi } from '../api/restaurantApi';
import type { OrderNotificationDTO, OrderItemDTO } from '../types/api';

const backgroundImage = require('../../assets/background.png');

const formatCurrency = (value: number): string => {
  return `${value.toFixed(3).replace('.', ',')} DT`;
};

const getSpecialInstructions = (items: OrderItemDTO[]): string[] =>
  items
    .map((item) => item.specialInstructions?.trim())
    .filter((instruction): instruction is string => Boolean(instruction));

type OrderDetailsRouteProp = { params: RootStackParamList['OrderDetails'] };

export const OrderDetailsScreen: React.FC = () => {
  const route = useRoute<OrderDetailsRouteProp>();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [order, setOrder] = useState<OrderNotificationDTO>(route.params.order);
  const [isMarkingReady, setIsMarkingReady] = useState(false);

  const isPreparing = order.status === 'PREPARING';
  const isReadyForPickup = order.status === 'READY_FOR_PICK_UP';

  const customerNotes = useMemo(() => getSpecialInstructions(order.items), [order.items]);
  const allergyNotes = useMemo(() => {
    if (customerNotes.length === 0) {
      return null;
    }

    const matching = customerNotes.filter((note) => /allerg/i.test(note));
    return matching.length > 0 ? matching.join('\n') : null;
  }, [customerNotes]);

  const additionalComments = useMemo(() => {
    const nonAllergyNotes = customerNotes.filter((note) => !/allerg/i.test(note));
    const savedAddressNotes = order.savedAddress?.notes?.trim();
    const savedAddressDirections = order.savedAddress?.directions?.trim();
    const deliverySavedAddressNotes = order.delivery?.savedAddress?.notes?.trim();
    const deliverySavedAddressDirections = order.delivery?.savedAddress?.directions?.trim();

    const combined = [
      nonAllergyNotes.length > 0 ? nonAllergyNotes.join('\n') : null,
      savedAddressNotes || null,
      savedAddressDirections || null,
      deliverySavedAddressNotes || null,
      deliverySavedAddressDirections || null,
    ].filter((value): value is string => Boolean(value));

    return combined.length > 0 ? combined.join('\n') : null;
  }, [customerNotes, order.delivery, order.savedAddress]);

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
          <StatusBar style="dark" />
          <View style={styles.screenContent}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.topBar}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  activeOpacity={0.85}
                >
                  <ArrowLeft color={colors.primary} size={moderateScale(20)} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.orderNumber}>{`Order N°${order.orderId}`}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalValue}>{formatCurrency(order.payment.total)}</Text>
                </View>
              </View>

              <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Details</Text>
                <View style={styles.cardDivider} />
                {order.items.map((item, index) => {
                  const extrasTotal = item.extrasTotal > 0 ? `+${formatCurrency(item.extrasTotal)}` : null;

                  return (
                    <View key={`${item.menuItemId}-${index}`} style={styles.menuRow}>
                      <View style={styles.menuInfo}>
                        <View style={styles.menuHeader}>
                          <Text style={styles.quantityLabel}>{`${item.quantity}X`}</Text>
                          <Text style={styles.menuName}>{item.menuItemName}</Text>
                        </View>
                        {item.extras.length > 0
                          ? item.extras.map((extra, extraIndex) => (
                              <Text key={`${extra}-${extraIndex}`} style={styles.extraLabel}>
                                {extra}
                              </Text>
                            ))
                          : null}
                      </View>
                      <View style={styles.priceColumn}>
                        <Text style={styles.priceLabel}>{formatCurrency(item.lineTotal)}</Text>
                        {extrasTotal ? <Text style={styles.extraPriceLabel}>{extrasTotal}</Text> : null}
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Notes</Text>
                <View style={styles.notesCard}>
                  <View style={styles.noteHeader}>
                    <CandyOff color={colors.primary} size={moderateScale(20)} strokeWidth={2.5} />
                    <Text style={styles.noteLabel}>Allergies</Text>
                  </View>
                  <Text style={styles.noteValue}>
                    {allergyNotes ?? 'No allergies reported.'}
                  </Text>

                  <View style={styles.noteDivider} />

                  <View style={styles.noteHeader}>
                    <MessageCircleMore color={colors.primary} size={moderateScale(20)} strokeWidth={2.5} />
                    <Text style={styles.noteLabel}>Additional Comments</Text>
                  </View>
                  <Text style={styles.noteValue}>
                    {additionalComments ?? 'No additional comments.'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.footerArea}>
              {(() => {
                const actions: { key: string; element: React.ReactNode }[] = [];

                if (isPreparing) {
                  actions.push({
                    key: 'mark-ready',
                    element: (
                      <TouchableOpacity
                        onPress={handleMarkReady}
                        style={[styles.actionButton, styles.primaryActionButton]}
                        activeOpacity={0.85}
                        disabled={isMarkingReady}
                      >
                        {isMarkingReady ? (
                          <ActivityIndicator color={colors.white} />
                        ) : (
                          <Text style={styles.primaryActionLabel}>Mark as ready</Text>
                        )}
                      </TouchableOpacity>
                    ),
                  });
                }

                if (isReadyForPickup) {
                  actions.push({
                    key: 'qr-code',
                    element: (
                      <TouchableOpacity
                        onPress={() => Alert.alert('QR Code', 'Show the pickup QR code to the driver.')}
                        style={[styles.actionButton, styles.secondaryActionButton]}
                        activeOpacity={0.85}
                      >
                        <QrCode color={colors.primary} size={moderateScale(18)} strokeWidth={2.5} />
                        <Text style={styles.secondaryActionLabel}>QR CODE</Text>
                      </TouchableOpacity>
                    ),
                  });
                }

                if (actions.length === 0) {
                  return null;
                }

                return (
                  <View style={styles.actionsRow}>
                    {actions.map((action, index) => (
                      <View
                        key={action.key}
                        style={[styles.actionWrapper, index === actions.length - 1 && styles.lastActionWrapper]}
                      >
                        {action.element}
                      </View>
                    ))}
                  </View>
                );
              })()}

              <View style={styles.footerNavigationWrapper}>
                <FooterNavigation />
              </View>
            </View>
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
  screenContent: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(32),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  backButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
    shadowColor: colors.mutedBlack,
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(6),
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  orderNumber: {
    ...typography.h2,
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  totalLabel: {
    ...typography.bodyStrong,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.navy,
    marginRight: moderateScale(12),
  },
  totalBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(18),
    minWidth: moderateScale(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalValue: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(20),
    marginBottom: moderateScale(24),
    shadowColor: colors.mutedBlack,
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(10),
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  detailsTitle: {
    ...typography.h3,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.navy,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray,
    marginVertical: moderateScale(14),
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(16),
  },
  menuInfo: {
    flex: 1,
    paddingRight: moderateScale(12),
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: moderateScale(6),
  },
  quantityLabel: {
    ...typography.h3,
    color: colors.primary,
    marginRight: moderateScale(8),
  },
  menuName: {
    ...typography.bodyStrong,
    flexShrink: 1,
    color: colors.navy,
  },
  extraLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: moderateScale(2),
  },
  priceColumn: {
    minWidth: moderateScale(90),
    alignItems: 'flex-end',
  },
  priceLabel: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  extraPriceLabel: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: moderateScale(4),
  },
  notesSection: {
    marginBottom: moderateScale(24),
  },
  notesTitle: {
    ...typography.h3,
    marginBottom: moderateScale(12),
    color: colors.navy,
  },
  notesCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(20),
    borderWidth: 1,
    borderColor: colors.gray,
    shadowColor: colors.mutedBlack,
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(10),
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  noteLabel: {
    ...typography.bodyStrong,
    marginLeft: moderateScale(10),
    color: colors.navy,
  },
  noteValue: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: moderateScale(12),
  },
  noteDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray,
    marginBottom: moderateScale(12),
  },
  footerArea: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(16),
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  actionWrapper: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  lastActionWrapper: {
    marginRight: 0,
  },
  actionButton: {
    height: moderateScale(60),
    borderRadius: moderateScale(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(16),
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.mutedBlack,
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(8),
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryActionLabel: {
    ...typography.button,
    fontSize: moderateScale(16),
    letterSpacing: 0.5,
  },
  secondaryActionButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryActionLabel: {
    ...typography.bodyStrong,
    color: colors.primary,
    fontSize: moderateScale(16),
    letterSpacing: 0.5,
    marginLeft: moderateScale(8),
  },
  footerNavigationWrapper: {
    marginTop: moderateScale(8),
  },
});
