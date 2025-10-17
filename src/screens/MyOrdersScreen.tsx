import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { moderateScale } from 'react-native-size-matters';
import { CandyOff, MessageCircleMore, QrCode } from 'lucide-react-native';
import { FooterNavigation } from '../components/FooterNavigation';
import { PickupQrModal } from '../components/PickupQrModal';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { restaurantApi } from '../api/restaurantApi';
import type { OrderItemDTO, OrderNotificationDTO, PaginatedResponse } from '../types/api';

const backgroundImage = require('../../assets/background.png');

const formatCurrency = (value: number): string => `${value.toFixed(3).replace('.', ',')} DT`;

const getSpecialInstructions = (items: OrderItemDTO[]): string[] =>
  items
    .map((item) => item.specialInstructions?.trim())
    .filter((instruction): instruction is string => Boolean(instruction));

const getAllergyNotes = (notes: string[]): string | null => {
  if (notes.length === 0) {
    return null;
  }

  const matching = notes.filter((note) => /allerg/i.test(note));
  return matching.length > 0 ? matching.join('\n') : null;
};

const getAdditionalComments = (
  notes: string[],
  order: OrderNotificationDTO
): string | null => {
  const nonAllergyNotes = notes.filter((note) => !/allerg/i.test(note));
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
};

type OrderHistoryCardProps = {
  order: OrderNotificationDTO;
  onMarkReady: (orderId: number) => void;
  onShowQr: (order: OrderNotificationDTO) => void;
  isMarking: boolean;
};

const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({
  order,
  onMarkReady,
  onShowQr,
  isMarking,
}) => {
  const customerNotes = useMemo(() => getSpecialInstructions(order.items), [order.items]);
  const allergyNotes = useMemo(() => getAllergyNotes(customerNotes), [customerNotes]);
  const additionalComments = useMemo(
    () => getAdditionalComments(customerNotes, order),
    [customerNotes, order]
  );

  const isPreparing = order.status === 'PREPARING';

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeaderRow}>
        <Text style={styles.orderNumber}>{`Order N°${order.orderId}`}</Text>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalValue}>{formatCurrency(order.payment.total)}</Text>
          </View>
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

      <View style={styles.notesCard}>
        <View style={styles.noteSection}>
          <View style={styles.noteHeader}>
            <CandyOff color={colors.primary} size={moderateScale(20)} strokeWidth={2.5} />
            <Text style={styles.noteLabel}>I have Allergies</Text>
          </View>
          <Text style={styles.noteValue}>{allergyNotes ?? 'No allergies reported.'}</Text>
        </View>

        <View style={styles.noteDivider} />

        <View style={styles.noteSection}>
          <View style={styles.noteHeader}>
            <MessageCircleMore color={colors.primary} size={moderateScale(20)} strokeWidth={2.5} />
            <Text style={styles.noteLabel}>comment</Text>
          </View>
          <Text style={styles.noteValue}>
            {additionalComments ?? 'Sauce Soja Salée Uniquement'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {isPreparing ? (
          <TouchableOpacity
            onPress={() => onMarkReady(order.orderId)}
            style={[styles.actionButton, styles.primaryActionButton]}
            activeOpacity={0.85}
            disabled={isMarking}
          >
            {isMarking ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryActionLabel}>Mark as ready</Text>
            )}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => onShowQr(order)}
          style={[styles.actionButton, styles.secondaryActionButton]}
          activeOpacity={0.85}
        >
          <QrCode color={colors.primary} size={moderateScale(18)} strokeWidth={2.5} />
          <Text style={styles.secondaryActionLabel}>QR CODE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

type FetchState = {
  items: OrderNotificationDTO[];
  page: number;
  pageSize: number;
  totalItems: number;
};

const initialState: FetchState = {
  items: [],
  page: 0,
  pageSize: 10,
  totalItems: 0,
};

export const MyOrdersScreen: React.FC = () => {
  const [state, setState] = useState<FetchState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingOrderId, setMarkingOrderId] = useState<number | null>(null);
  const [pickupOrder, setPickupOrder] = useState<OrderNotificationDTO | null>(null);

  const loadOrders = useCallback(
    async (pageToLoad: number, append: boolean) => {
      setIsLoading(true);
      setError(null);

      try {
        const response: PaginatedResponse<OrderNotificationDTO> = await restaurantApi.getMyOrders({
          page: pageToLoad,
          pageSize: state.pageSize,
        });

        setState((prev) => ({
          items: append ? [...prev.items, ...response.items] : response.items,
          page: response.page,
          pageSize: response.pageSize,
          totalItems: response.totalItems,
        }));
      } catch (err) {
        setError('Unable to load your orders right now. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    },
    [state.pageSize]
  );

  useEffect(() => {
    void loadOrders(0, false);
  }, [loadOrders]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadOrders(0, false).finally(() => setIsRefreshing(false));
  }, [loadOrders]);

  const handleLoadMore = useCallback(() => {
    if (isLoading) {
      return;
    }

    if (state.items.length >= state.totalItems) {
      return;
    }

    const nextPage = state.page + 1;
    void loadOrders(nextPage, true);
  }, [isLoading, state.items.length, state.page, state.totalItems, loadOrders]);

  const handleMarkReady = useCallback(
    async (orderId: number) => {
      setMarkingOrderId(orderId);

      try {
        const updatedOrder = await restaurantApi.markOrderReady(orderId);
        setState((prev) => ({
          ...prev,
          items: prev.items.map((order) => (order.orderId === orderId ? updatedOrder : order)),
        }));
        Alert.alert('Order ready', 'The order is now ready for pickup.');
      } catch (err) {
        Alert.alert('Unable to mark as ready', 'Please try again in a moment.');
      } finally {
        setMarkingOrderId(null);
      }
    },
    []
  );

  const handleShowQr = useCallback((order: OrderNotificationDTO) => {
    if (!order.pickupToken) {
      Alert.alert(
        'Pickup code unavailable',
        'This order does not have a pickup QR code yet. Please try again shortly.'
      );
      return;
    }

    setPickupOrder(order);
  }, []);

  const handleCloseQr = useCallback(() => {
    setPickupOrder(null);
  }, []);

  const renderOrder = useCallback(
    ({ item }: { item: OrderNotificationDTO }) => (
      <OrderHistoryCard
        order={item}
        onMarkReady={handleMarkReady}
        onShowQr={handleShowQr}
        isMarking={markingOrderId === item.orderId}
      />
    ),
    [handleMarkReady, handleShowQr, markingOrderId]
  );

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <View style={styles.overlayContainer}>
        <View pointerEvents="none" style={styles.tintOverlay} />
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <View style={styles.screenContent}>
            <FlatList
              data={state.items}
              keyExtractor={(item) => item.orderId.toString()}
              renderItem={renderOrder}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  {isLoading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={styles.emptyText}>
                      {error ?? 'No orders found for the selected period.'}
                    </Text>
                  )}
                </View>
              )}
              onEndReachedThreshold={0.4}
              onEndReached={handleLoadMore}
              ListFooterComponent={() =>
                state.items.length > 0 && state.items.length < state.totalItems ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                ) : null
              }
            />

            <FooterNavigation activeKey="orders" />
          </View>
        </SafeAreaView>
      </View>

      <PickupQrModal
        visible={Boolean(pickupOrder?.pickupToken)}
        pickupToken={pickupOrder?.pickupToken ?? ''}
        onDismiss={handleCloseQr}
      />
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  safeArea: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(16),
  },
  listContent: {
    paddingBottom: moderateScale(24),
  },
  listSeparator: {
    height: moderateScale(24),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(48),
  },
  emptyText: {
    ...typography.bodyMedium,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  footerLoader: {
    paddingVertical: moderateScale(20),
  },
  orderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: moderateScale(20),
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(20),
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.mutedBlack,
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(10),
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  orderNumber: {
    ...typography.h2,
    color: colors.navy,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.bodyStrong,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.navy,
    marginRight: moderateScale(8),
  },
  totalBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(18),
    minWidth: moderateScale(90),
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalValue: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(18),
    marginBottom: moderateScale(16),
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
    marginVertical: moderateScale(12),
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(14),
  },
  menuInfo: {
    flex: 1,
    paddingRight: moderateScale(12),
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: moderateScale(4),
  },
  quantityLabel: {
    ...typography.h3,
    color: colors.primary,
    marginRight: moderateScale(6),
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
    ...typography.captionStrong,
    color: colors.primary,
  },
  notesCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(18),
    marginBottom: moderateScale(18),
  },
  noteSection: {
    marginBottom: moderateScale(8),
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  noteLabel: {
    ...typography.bodyStrong,
    textTransform: 'capitalize',
    color: colors.navy,
    marginLeft: moderateScale(8),
  },
  noteValue: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: moderateScale(20),
  },
  noteDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray,
    marginVertical: moderateScale(10),
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    height: moderateScale(48),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
    marginRight: moderateScale(12),
  },
  secondaryActionButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: moderateScale(8),
  },
  primaryActionLabel: {
    ...typography.button,
    color: colors.white,
  },
  secondaryActionLabel: {
    ...typography.button,
    color: colors.primary,
  },
});

