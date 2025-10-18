import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { moderateScale } from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Calendar } from 'react-native-calendars';
import type { DateObject, MarkedDates } from 'react-native-calendars';
import { CalendarDays, X } from 'lucide-react-native';
import { FooterNavigation } from '../components/FooterNavigation';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { restaurantApi } from '../api/restaurantApi';
import type { OrderItemDTO, OrderNotificationDTO, PaginatedResponse } from '../types/api';
import type { RootStackParamList } from '../navigation/types';
import { useOrdersStore } from '../stores';

const backgroundImage = require('../../assets/background.png');

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

type StatusCategory = 'pending' | 'preparing' | 'ready' | 'pickedUp' | 'other';

type StatusMeta = {
  label: string;
  badgeBackground: string;
  badgeText: string;
};

const STATUS_META: Record<StatusCategory, StatusMeta> = {
  pending: {
    label: 'Pending',
    badgeBackground: '#FFF3D6',
    badgeText: colors.textPrimary,
  },
  preparing: {
    label: 'Preparing',
    badgeBackground: colors.primary,
    badgeText: colors.white,
  },
  ready: {
    label: 'Ready',
    badgeBackground: '#E0E0E0',
    badgeText: colors.textPrimary,
  },
  pickedUp: {
    label: 'Picked up',
    badgeBackground: colors.success,
    badgeText: colors.white,
  },
  other: {
    label: 'Pending',
    badgeBackground: '#E0E0E0',
    badgeText: colors.textPrimary,
  },
};

const formatCurrency = (value: number): string => `${value.toFixed(2)} DT`;

const getItemsCount = (items: OrderItemDTO[]): number =>
  items.reduce((total, item) => total + item.quantity, 0);

const getStatusCategory = (status: OrderNotificationDTO['status']): StatusCategory => {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'PREPARING':
    case 'ACCEPTED':
      return 'preparing';
    case 'READY_FOR_PICK_UP':
      return 'ready';
    case 'DELIVERED':
    case 'IN_DELIVERY':
      return 'pickedUp';
    default:
      return 'other';
  }
};

const getRelativeTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);

  if (diffMinutes < 1) {
    return 'Just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  }

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
};

const formatFullDate = (date: Date): string => {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

const formatFilterDateLabel = (date: Date): string => {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

const formatCalendarDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseCalendarDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

type FiltersState = {
  from: Date | null;
  to: Date | null;
};

const initialFilters: FiltersState = {
  from: null,
  to: null,
};

type PendingActionState = { id: number; type: 'accept' | 'decline' } | null;

type OrderListItemProps = {
  order: OrderNotificationDTO;
  onPress: (order: OrderNotificationDTO) => void;
  onAcceptPending: (order: OrderNotificationDTO) => void;
  onDeclinePending: (order: OrderNotificationDTO) => void;
  pendingAction: PendingActionState;
};

const OrderListItem: React.FC<OrderListItemProps> = ({
  order,
  onPress,
  onAcceptPending,
  onDeclinePending,
  pendingAction,
}) => {
  const category = getStatusCategory(order.status);
  const meta = STATUS_META[category];
  const itemsCount = getItemsCount(order.items);
  const relativeTime = getRelativeTime(order.date);
  const isPending = order.status === 'PENDING';
  const isActionInProgress = pendingAction?.id === order.orderId;
  const isAccepting = isActionInProgress && pendingAction?.type === 'accept';
  const isDeclining = isActionInProgress && pendingAction?.type === 'decline';

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{`#${order.orderId}`}</Text>
        <View style={[styles.statusBadge, { backgroundColor: meta.badgeBackground }]}>
          <Text style={[styles.statusBadgeLabel, { color: meta.badgeText }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.orderMetaRow}>
        <Text style={styles.orderTotal}>{formatCurrency(order.payment.total)}</Text>
        <Text style={styles.orderTime}>{relativeTime}</Text>
      </View>

      <Text style={styles.orderItems}>{`${itemsCount} item${itemsCount === 1 ? '' : 's'}`}</Text>

      {isPending && (
        <View style={styles.pendingActionsRow}>
          <TouchableOpacity
            onPress={() => onDeclinePending(order)}
            activeOpacity={0.85}
            style={[styles.pendingActionButton, styles.pendingDeclineButton, isActionInProgress && styles.pendingActionDisabled]}
            disabled={isActionInProgress}
          >
            {isDeclining ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.pendingActionLabel, styles.pendingDeclineLabel]}>Decline</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onAcceptPending(order)}
            activeOpacity={0.85}
            style={[styles.pendingActionButton, styles.pendingAcceptButton, isActionInProgress && styles.pendingActionDisabled]}
            disabled={isActionInProgress}
          >
            {isAccepting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.pendingActionLabel}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        onPress={() => onPress(order)}
        activeOpacity={0.85}
        style={styles.detailsButton}
      >
        <Text style={styles.detailsButtonLabel}>See details</Text>
      </TouchableOpacity>
    </View>
  );
};

export const MyOrdersScreen: React.FC = () => {
  const [state, setState] = useState<FetchState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [activePicker, setActivePicker] = useState<'from' | 'to' | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [pendingAction, setPendingAction] = useState<PendingActionState>(null);
  const bumpActiveOrdersRefreshToken = useOrdersStore((state) => state.bumpActiveOrdersRefreshToken);

  const loadOrders = useCallback(
    async (pageToLoad: number, append: boolean) => {
      setIsLoading(true);

      try {
        const response: PaginatedResponse<OrderNotificationDTO> = await restaurantApi.getMyOrders({
          page: pageToLoad,
          pageSize: state.pageSize,
          from: filters.from ?? undefined,
          to: filters.to ?? undefined,
        });

        setState((prev) => ({
          items: append ? [...prev.items, ...response.items] : response.items,
          page: response.page,
          pageSize: response.pageSize,
          totalItems: response.totalItems,
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [state.pageSize, filters.from, filters.to]
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

  const handlePressOrder = useCallback(
    (order: OrderNotificationDTO) => {
      navigation.navigate('OrderDetails', { order });
    },
    [navigation]
  );

  const updateOrderInList = useCallback((updated: OrderNotificationDTO) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.orderId === updated.orderId ? updated : item)),
    }));
  }, []);

  const handleAcceptPending = useCallback(
    async (order: OrderNotificationDTO) => {
      if (pendingAction) {
        return;
      }

      setPendingAction({ id: order.orderId, type: 'accept' });

      try {
        const updated = await restaurantApi.acceptOrder(order.orderId);
        updateOrderInList(updated);
        bumpActiveOrdersRefreshToken();
      } catch (error) {
        Alert.alert('Unable to accept order', 'Please try again in a moment.');
      } finally {
        setPendingAction(null);
      }
    },
    [bumpActiveOrdersRefreshToken, pendingAction, updateOrderInList]
  );

  const handleDeclinePending = useCallback(
    async (order: OrderNotificationDTO) => {
      if (pendingAction) {
        return;
      }

      setPendingAction({ id: order.orderId, type: 'decline' });

      try {
        const updated = await restaurantApi.rejectOrder(order.orderId);
        updateOrderInList(updated);
      } catch (error) {
        Alert.alert('Unable to decline order', 'Please try again in a moment.');
      } finally {
        setPendingAction(null);
      }
    },
    [pendingAction, updateOrderInList]
  );

  const todayLabel = useMemo(() => `Today: ${formatFullDate(new Date())}`, []);

  const markedDates = useMemo<MarkedDates>(() => {
    const marks: MarkedDates = {};

    const fromDate = filters.from ? formatCalendarDate(filters.from) : undefined;
    const toDate = filters.to ? formatCalendarDate(filters.to) : undefined;

    if (fromDate && toDate) {
      const fromTime = parseCalendarDate(fromDate).getTime();
      const toTime = parseCalendarDate(toDate).getTime();
      const [start, end] = fromTime <= toTime ? [fromDate, toDate] : [toDate, fromDate];

      if (start === end) {
        marks[start] = {
          startingDay: true,
          endingDay: true,
          color: colors.primary,
          textColor: colors.white,
        };
      } else {
        marks[start] = {
          startingDay: true,
          color: colors.primary,
          textColor: colors.white,
        };

        const current = parseCalendarDate(start);
        current.setDate(current.getDate() + 1);

        while (formatCalendarDate(current) < end) {
          const currentKey = formatCalendarDate(current);
          marks[currentKey] = {
            color: '#E6F1FF',
            textColor: colors.textPrimary,
          };
          current.setDate(current.getDate() + 1);
        }

        marks[end] = {
          endingDay: true,
          color: colors.primary,
          textColor: colors.white,
        };
      }
    } else if (fromDate) {
      marks[fromDate] = {
        startingDay: true,
        endingDay: true,
        color: colors.primary,
        textColor: colors.white,
      };
    } else if (toDate) {
      marks[toDate] = {
        startingDay: true,
        endingDay: true,
        color: colors.primary,
        textColor: colors.white,
      };
    }

    return marks;
  }, [filters.from, filters.to]);

  const handleSelectDate = useCallback(
    (day: DateObject) => {
      if (!activePicker) {
        return;
      }

      const selectedDate = parseCalendarDate(day.dateString);

      setFilters((prev) => {
        if (activePicker === 'from') {
          let nextTo = prev.to;
          if (nextTo && selectedDate > nextTo) {
            nextTo = selectedDate;
          }

          return {
            from: selectedDate,
            to: nextTo,
          };
        }

        let nextFrom = prev.from;
        if (nextFrom && selectedDate < nextFrom) {
          nextFrom = selectedDate;
        }

        return {
          from: nextFrom ?? selectedDate,
          to: selectedDate,
        };
      });

      setActivePicker(null);
    },
    [activePicker]
  );

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const getFilterLabel = useCallback(
    (type: 'from' | 'to'): string => {
      const value = type === 'from' ? filters.from : filters.to;
      return value ? formatFilterDateLabel(value) : 'Select date';
    },
    [filters.from, filters.to]
  );

  const statusSummary = useMemo(() => {
    return state.items.reduce(
      (acc, order) => {
        const category = getStatusCategory(order.status);
        if (category === 'preparing' || category === 'pending') {
          acc.preparing += 1;
        } else if (category === 'ready') {
          acc.ready += 1;
        } else if (category === 'pickedUp') {
          acc.pickedUp += 1;
        }
        return acc;
      },
      { preparing: 0, ready: 0, pickedUp: 0 }
    );
  }, [state.items]);

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.screenContainer}>
          <View style={styles.header}>
            <Text style={styles.screenTitle}>My Orders</Text>
            <Text style={styles.todayLabel}>{todayLabel}</Text>
            <Text style={styles.statusSummaryText}>
              <Text style={styles.statusSummaryLabel}>Status </Text>
              <Text style={styles.statusPreparing}>{`${statusSummary.preparing} Preparing`}</Text>
              <Text style={styles.statusSeparator}> | </Text>
              <Text style={styles.statusReady}>{`${statusSummary.ready} Ready`}</Text>
              <Text style={styles.statusSeparator}> | </Text>
              <Text style={styles.statusPicked}>{`${statusSummary.pickedUp} Picked up`}</Text>
            </Text>
            <View style={styles.filtersRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.filterButton}
                onPress={() => setActivePicker('from')}
              >
                <View style={styles.filterIconWrapper}>
                  <CalendarDays size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.filterLabel}>From</Text>
                  <Text style={styles.filterValue}>{getFilterLabel('from')}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.filterButton}
                onPress={() => setActivePicker('to')}
              >
                <View style={styles.filterIconWrapper}>
                  <CalendarDays size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.filterLabel}>To</Text>
                  <Text style={styles.filterValue}>{getFilterLabel('to')}</Text>
                </View>
              </TouchableOpacity>
              {(filters.from || filters.to) && (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleClearFilters}
                  style={styles.clearFiltersButton}
                  activeOpacity={0.85}
                >
                  <Text style={styles.clearFiltersText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={state.items}
            keyExtractor={(item) => item.orderId.toString()}
          renderItem={({ item }) => (
            <OrderListItem
              order={item}
              onPress={handlePressOrder}
              onAcceptPending={handleAcceptPending}
              onDeclinePending={handleDeclinePending}
              pendingAction={pendingAction}
            />
          )}
            contentContainerStyle={[styles.listContent, state.items.length === 0 && styles.emptyList]}
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}
            onEndReached={handleLoadMore}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListFooterComponent={() =>
              state.items.length > 0 && state.items.length < state.totalItems ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                {isLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.emptyText}>You have no orders yet.</Text>
                )}
              </View>
            )}
          />
        </View>

        <FooterNavigation activeKey="orders" />
      </SafeAreaView>

      <Modal
        visible={activePicker !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setActivePicker(null)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {activePicker === 'from' ? 'Select start date' : 'Select end date'}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setActivePicker(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleSelectDate}
              markedDates={markedDates}
              markingType="period"
              enableSwipeMonths
              style={styles.calendar}
              theme={{
                arrowColor: colors.primary,
                todayTextColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
                textDayFontFamily: typography.bodyMedium.fontFamily,
                textMonthFontFamily: typography.h3.fontFamily,
                textDayHeaderFontFamily: typography.captionStrong.fontFamily,
              }}
            />
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(12),
  },
  header: {
    marginBottom: moderateScale(20),
  },
  screenTitle: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.primary,
    marginBottom: moderateScale(8),
  },
  todayLabel: {
    ...typography.bodyMedium,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: moderateScale(6),
  },
  statusSummaryText: {
    ...typography.bodyStrong,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  statusSummaryLabel: {
    color: colors.textSecondary,
  },
  statusSeparator: {
    color: colors.textSecondary,
  },
  statusPreparing: {
    color: colors.primary,
  },
  statusReady: {
    color: colors.textPrimary,
  },
  statusPicked: {
    color: colors.success,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: moderateScale(16),
    columnGap: moderateScale(12),
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    backgroundColor: colors.white,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: moderateScale(10),
  },
  filterIconWrapper: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F1F5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: moderateScale(2),
  },
  filterValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  clearFiltersButton: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    backgroundColor: 'transparent',
    borderRadius: moderateScale(12),
  },
  clearFiltersText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: moderateScale(120),
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  listSeparator: {
    height: moderateScale(12),
  },
  footerLoader: {
    paddingVertical: moderateScale(20),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  orderNumber: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  statusBadge: {
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(4),
  },
  statusBadgeLabel: {
    ...typography.captionStrong,
    textTransform: 'capitalize',
  },
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  orderTotal: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  orderTime: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  orderItems: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: moderateScale(12),
  },
  pendingActionsRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  pendingActionButton: {
    flex: 1,
    height: moderateScale(42),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDeclineButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  pendingAcceptButton: {
    backgroundColor: colors.success,
  },
  pendingActionLabel: {
    ...typography.button,
    textTransform: 'uppercase',
  },
  pendingDeclineLabel: {
    color: colors.primary,
  },
  pendingActionDisabled: {
    opacity: 0.65,
  },
  detailsButton: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(16),
    height: moderateScale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonLabel: {
    ...typography.button,
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  calendarModal: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(16),
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  calendarTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  calendar: {
    borderRadius: moderateScale(12),
  },
});
