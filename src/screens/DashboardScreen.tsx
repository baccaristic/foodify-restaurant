import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, FlatList, Text, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { moderateScale } from 'react-native-size-matters';
import { RestaurantHeader } from '../components/RestaurantHeader';
import { SectionHeader } from '../components/SectionHeader';
import { OrderCard } from '../components/OrderCard';
import { QuickActionCard } from '../components/QuickActionCard';
import { StatisticCard } from '../components/StatisticCard';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { FooterNavigation } from '../components/FooterNavigation';
import { Image } from 'expo-image';

type Order = {
  id: number;
  items: number;
  total: number;
};

const ordersData: Order[] = [
  { id: 28, items: 5, total: 200 },
  { id: 27, items: 4, total: 200 },
  { id: 26, items: 3, total: 150 },
];

const backgroundImage = require('../../assets/background.png');
const closedSignImage = require('../../assets/closedSign.png');

export const DashboardScreen: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);


  const ordersCount = useMemo(() => ordersData.length, []);
  const displayedOrderCount = isOpen ? ordersCount : 0;

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
              <RestaurantHeader name="Torii Sushi" isOpen={isOpen} onToggle={setIsOpen} />

              <View style={styles.section}>
                <SectionHeader
                  title="Active Orders"
                  trailing={<OrderCountBadge value={ordersCount} />}
                />
                {isOpen ? (
                  <FlatList
                    data={ordersData}
                    horizontal
                    keyExtractor={(item) => item.id.toString()}
                    showsHorizontalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ width: moderateScale(12) }} />}
                    renderItem={({ item }) => (
                      <OrderCard orderNumber={item.id} items={item.items} total={item.total} />
                    )}
                  />
                ) : (
                  <ClosedRestaurantNotice />
                )}
              </View>

              <View style={styles.section}>
                <View style={styles.quickActionsRow}>
                  <QuickActionCard title="My Menu" variant="menu" />
                  <View style={styles.quickActionSpacer} />
                  <QuickActionCard title="My Orders" variant="orders" />
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
            <FooterNavigation />
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
