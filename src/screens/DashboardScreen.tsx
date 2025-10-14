import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, FlatList, Text, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { moderateScale } from 'react-native-size-matters';
import { LinearGradient } from 'expo-linear-gradient';
import { RestaurantHeader } from '../components/RestaurantHeader';
import { SectionHeader } from '../components/SectionHeader';
import { OrderCard } from '../components/OrderCard';
import { QuickActionCard } from '../components/QuickActionCard';
import { StatisticCard } from '../components/StatisticCard';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

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

export const DashboardScreen: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const ordersCount = useMemo(() => ordersData.length, []);

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlayContainer}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(255,255,255,0.98)',
            'rgba(255,255,255,0.9)',
            'rgba(255,255,255,0.65)',
            'rgba(255,255,255,0)',
          ]}
          locations={[0, 0.3, 0.65, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientOverlay}
        />
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <RestaurantHeader name="Torii Sushi" isOpen={isOpen} onToggle={setIsOpen} />

            <View style={styles.section}>
              <SectionHeader
                title="Active Orders"
                trailing={<OrderCountBadge value={ordersCount} />}
              />
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
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

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
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(32),
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
});
