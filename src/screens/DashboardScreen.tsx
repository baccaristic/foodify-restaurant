import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  Text,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { moderateScale } from 'react-native-size-matters';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RestaurantHeader } from '../components/RestaurantHeader';
import { SectionHeader } from '../components/SectionHeader';
import { OrderCard } from '../components/OrderCard';
import { QuickActionCard } from '../components/QuickActionCard';
import { StatisticCard } from '../components/StatisticCard';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { FooterNavigation } from '../components/FooterNavigation';
import { Image } from 'expo-image';
import { useAuthStore, useOrdersStore } from '../stores';
import { restaurantApi } from '../api/restaurantApi';
import type { OrderNotificationDTO } from '../types/api';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation';

const backgroundImage = require('../../assets/background.png');
const closedSignImage = require('../../assets/closedSign.png');

export const DashboardScreen: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeOrders, setActiveOrders] = useState<OrderNotificationDTO[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const logout = useAuthStore((state) => state.logout);
  const activeOrdersRefreshToken = useOrdersStore((state) => state.activeOrdersRefreshToken);
  const isMountedRef = useRef(true);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleLogout = useCallback(() => {
    void logout();
  }, [logout]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchActiveOrders = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setIsLoadingOrders(true);
    setOrdersError(null);

    try {
      const orders = await restaurantApi.getActiveOrders();

      if (isMountedRef.current) {
        setActiveOrders(orders);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setActiveOrders([]);
        setOrdersError('Unable to load active orders.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingOrders(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchActiveOrders();
    }, [fetchActiveOrders, activeOrdersRefreshToken])
  );

  const handleReloadOrders = useCallback(() => {
    void fetchActiveOrders();
  }, [fetchActiveOrders]);

  const ordersCount = useMemo(() => activeOrders.length, [activeOrders]);
  const displayedOrderCount = isOpen ? ordersCount : 0;
  const handleNavigateMenu = useCallback(() => {
    navigation.navigate('Menu');
  }, [navigation]);

  const handleNavigateOrders = useCallback(() => {
    navigation.navigate('MyOrders');
  }, [navigation]);

  const renderOrderCard = useCallback(
    ({ item }: { item: OrderNotificationDTO }) => {
      const itemsTotal = item.items.reduce((total, orderItem) => total + orderItem.quantity, 0);

      const handlePress = () => {
        navigation.navigate('OrderDetails', { order: item });
      };

      return (
        <OrderCard
          orderNumber={item.orderId}
          items={itemsTotal}
          total={item.payment.total}
          onPress={handlePress}
        />
      );
    },
    [navigation]
  );

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
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
              <RestaurantHeader
                name="Torii Sushi"
                isOpen={isOpen}
                onToggle={setIsOpen}
                onLogout={handleLogout}
              />

              <View style={styles.section}>
                <SectionHeader
                  title="Active Orders"
                  trailing={<OrderCountBadge value={displayedOrderCount} />}
                />
                {isOpen ? (
                  <View>
                    {isLoadingOrders ? (
                      <View style={styles.ordersPlaceholder}>
                        <ActivityIndicator color={colors.primary} />
                      </View>
                    ) : ordersError ? (
                      <View style={styles.ordersPlaceholder}>
                        <Text style={styles.errorText}>{ordersError}</Text>
                        <TouchableOpacity
                          onPress={handleReloadOrders}
                          style={styles.retryButton}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.retryButtonText}>Try again</Text>
                        </TouchableOpacity>
                      </View>
                    ) : activeOrders.length === 0 ? (
                      <View style={styles.ordersPlaceholder}>
                        <Text style={styles.emptyText}>No active orders right now.</Text>
                      </View>
                    ) : (
                      <FlatList
                        data={activeOrders}
                        horizontal
                        keyExtractor={(item) => item.orderId.toString()}
                        showsHorizontalScrollIndicator={false}
                        ItemSeparatorComponent={() => (
                          <View style={{ width: moderateScale(12) }} />
                        )}
                        renderItem={renderOrderCard}
                      />
                    )}
                  </View>
                ) : (
                  <ClosedRestaurantNotice />
                )}
              </View>

              <View style={styles.section}>
                <View style={styles.quickActionsRow}>
                  <QuickActionCard title="My Menu" variant="menu" onPress={handleNavigateMenu} />
                  <View style={styles.quickActionSpacer} />
                  <QuickActionCard title="My Orders" variant="orders" onPress={handleNavigateOrders} />
                </View>
              </View>

              <View style={styles.section}>
                <SectionHeader title="Performance Summary" />
                <View style={styles.statsRow}>
                  <StatisticCard title="Orders Completed" value="25" change="+25%" />
                  <View style={styles.statSpacer} />
                  <StatisticCard title="Revenue" value="532" unit="DT" change="+25%" />
                </View>
              </View>
            </ScrollView>
            <FooterNavigation activeKey="home" ordersBadgeCount={activeOrders.length} />
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const ClosedRestaurantNotice: React.FC = () => (
  <View style={styles.closedNoticeContainer}>
    <View style={styles.closedCard}>
      <Image source={closedSignImage} style={styles.closedImage} resizeMode="contain" />
      <Text style={styles.closedTitle}>Your restaurant is closed</Text>
      <Text style={styles.closedSubtitle}>
        Open your hours to start receiving orders again!
      </Text>
    </View>
  </View>
);

const OrderCountBadge: React.FC<{ value: number }> = ({ value }) => (
  <View style={styles.badgeContainer}>
    <Text style={styles.badgeText}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    flex: 1,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  safeArea: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(24),
    paddingTop: moderateScale(12),
  },
  section: {
    marginTop: moderateScale(24),
  },
  ordersPlaceholder: {
    width: '100%',
    minHeight: moderateScale(140),
    borderRadius: moderateScale(20),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(24),
  },
  errorText: {
    ...typography.bodyMedium,
    textAlign: 'center',
    color: '#E53935',
    marginBottom: moderateScale(16),
  },
  retryButton: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    ...typography.button,
  },
  emptyText: {
    ...typography.bodyMedium,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  quickActionSpacer: {
    width: moderateScale(16),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statSpacer: {
    width: moderateScale(16),
  },
  badgeContainer: {
    minWidth: moderateScale(48),
    height: moderateScale(48),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(24),
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.inverseTitle,
    fontSize: moderateScale(20),
  },
  closedNoticeContainer: {
    marginTop: moderateScale(24),
    alignItems: 'center',
  },
  closedCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    paddingVertical: moderateScale(32),
    paddingHorizontal: moderateScale(24),
    shadowColor: colors.navy,
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(12),
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  closedImage: {
    width: '60%',
    aspectRatio: 4 / 3,
    marginBottom: moderateScale(24),
  },
  closedTitle: {
    ...typography.bodyStrong,
    fontSize: moderateScale(18),
    textTransform: 'uppercase',
    textAlign: 'center',
    color: colors.navy,
    marginBottom: moderateScale(12),
  },
  closedSubtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
