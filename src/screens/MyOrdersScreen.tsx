import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { FooterNavigation } from '../components/FooterNavigation';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { restaurantApi } from '../api/restaurantApi';
import type { OrderItemDTO, OrderNotificationDTO, PaginatedResponse } from '../types/api';
import type { RootStackParamList } from '../navigation/types';

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

type StatusCategory = 'preparing' | 'ready' | 'pickedUp' | 'other';

type StatusMeta = {
  label: string;
  badgeBackground: string;
  badgeText: string;
};

const STATUS_META: Record<StatusCategory, StatusMeta> = {
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
    case 'PREPARING':
    case 'PENDING':
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

type OrderListItemProps = {
  order: OrderNotificationDTO;
  onPress: (order: OrderNotificationDTO) => void;
};

const OrderListItem: React.FC<OrderListItemProps> = ({ order, onPress }) => {
  const category = getStatusCategory(order.status);
  const meta = STATUS_META[category];
  const itemsCount = getItemsCount(order.items);
  const relativeTime = getRelativeTime(order.date);

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
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const loadOrders = useCallback(
    async (pageToLoad: number, append: boolean) => {
      setIsLoading(true);

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

  const handlePressOrder = useCallback(
    (order: OrderNotificationDTO) => {
      navigation.navigate('OrderDetails', { order });
    },
    [navigation]
  );

  const todayLabel = useMemo(() => `Today: ${formatFullDate(new Date())}`, []);

  const statusSummary = useMemo(() => {
    return state.items.reduce(
      (acc, order) => {
        const category = getStatusCategory(order.status);
        if (category === 'preparing') {
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
          </View>

          <FlatList
            data={state.items}
            keyExtractor={(item) => item.orderId.toString()}
            renderItem={({ item }) => <OrderListItem order={item} onPress={handlePressOrder} />}
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
});
