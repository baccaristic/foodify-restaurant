import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { BarChart3, Home, Settings, ShoppingBag } from 'lucide-react-native';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badgeCount?: number;
};

const navItems: NavItem[] = [
  { key: 'home', label: 'Home', icon: Home, active: true },
  { key: 'orders', label: 'Orders', icon: ShoppingBag, badgeCount: 3 },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export const FooterNavigation: React.FC = () => (
  <View style={styles.container}>
    {navItems.map(({ key, label, icon: IconComponent, active, badgeCount }) => (
      <View key={key} style={styles.item}>
        <View style={styles.iconWrapper}>
          <IconComponent
            color={active ? colors.white : 'rgba(255, 255, 255, 0.7)'}
            size={moderateScale(24)}
            strokeWidth={active ? 2.4 : 2}
          />
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

