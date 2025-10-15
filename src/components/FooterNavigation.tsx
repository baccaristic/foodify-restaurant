import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type NavItem = {
  key: string;
  label: string;
  icon: React.FC<{ active: boolean }>;
  active?: boolean;
  badgeCount?: number;
};

const HomeIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <Svg width={moderateScale(24)} height={moderateScale(24)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4.5 10.75L12 4l7.5 6.75v9h-5v-5h-5v5h-5z"
      fill={active ? colors.white : 'rgba(255, 255, 255, 0.7)'}
    />
  </Svg>
);

const OrdersIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <Svg width={moderateScale(24)} height={moderateScale(24)} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 5.5h12l-1 13H7l-1-13z"
      stroke={active ? colors.white : 'rgba(255, 255, 255, 0.7)'}
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    <Path
      d="M9 5.5V4a3 3 0 013-3 3 3 0 013 3v1.5"
      stroke={active ? colors.white : 'rgba(255, 255, 255, 0.7)'}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const AnalyticsIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <Svg width={moderateScale(24)} height={moderateScale(24)} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="4 16 9 11 13 14 20 7"
      stroke={active ? colors.white : 'rgba(255, 255, 255, 0.7)'}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx={20}
      cy={7}
      r={1.2}
      fill={active ? colors.white : 'rgba(255, 255, 255, 0.7)'}
    />
  </Svg>
);

const SettingsIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <Svg width={moderateScale(24)} height={moderateScale(24)} viewBox="0 0 24 24" fill="none">
    <Circle
      cx={12}
      cy={12}
      r={3.2}
      stroke={active ? colors.white : 'rgba(255, 255, 255, 0.7)'}
      strokeWidth={1.5}
    />
    <Path
      d="M12 2v3M12 19v3M4.9 4.9l2.12 2.12M16.98 16.98l2.12 2.12M2 12h3M19 12h3M4.9 19.1l2.12-2.12M16.98 7.02l2.12-2.12"
      stroke={active ? colors.white : 'rgba(255, 255, 255, 0.7)'}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const navItems: NavItem[] = [
  { key: 'home', label: 'Home', icon: HomeIcon, active: true },
  { key: 'orders', label: 'Orders', icon: OrdersIcon, badgeCount: 3 },
  { key: 'analytics', label: 'Analytics', icon: AnalyticsIcon },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const FooterNavigation: React.FC = () => (
  <View style={styles.container}>
    {navItems.map(({ key, label, icon: IconComponent, active, badgeCount }) => (
      <View key={key} style={styles.item}>
        <View style={styles.iconWrapper}>
          <IconComponent active={Boolean(active)} />
          {badgeCount ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeCount}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(24),
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    shadowColor: colors.mutedBlack,
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(8),
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: moderateScale(44),
    height: moderateScale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: moderateScale(4),
    minWidth: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(5),
  },
  badgeText: {
    ...typography.captionStrong,
    fontSize: moderateScale(10),
    color: colors.primary,
  },
  label: {
    marginTop: moderateScale(6),
    ...typography.button,
    fontSize: moderateScale(12),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeLabel: {
    color: colors.white,
  },
});

