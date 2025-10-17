import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { BarChart3, Home, Settings, ShoppingBag } from 'lucide-react-native';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation';

type FooterNavKey = 'home' | 'orders' | 'analytics' | 'settings';
type NavigableRoute = Extract<keyof RootStackParamList, 'Dashboard' | 'MyOrders'>;

type NavItem = {
  key: FooterNavKey;
  label: string;
  icon: LucideIcon;
  route?: NavigableRoute;
};

const navItems: NavItem[] = [
  { key: 'home', label: 'Home', icon: Home, route: 'Dashboard' },
  { key: 'orders', label: 'Orders', icon: ShoppingBag, route: 'MyOrders' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
];

type FooterNavigationProps = {
  activeKey?: FooterNavKey;
  ordersBadgeCount?: number;
};

export const FooterNavigation: React.FC<FooterNavigationProps> = ({
  activeKey = 'home',
  ordersBadgeCount = 0,
}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleNavigate = useCallback(
    (item: NavItem) => {
      if (!item.route || item.key === activeKey) {
        return;
      }

      navigation.navigate(item.route);
    },
    [activeKey, navigation]
  );

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = item.key === activeKey;
        const isDisabled = !item.route;
        const badgeCount = item.key === 'orders' ? ordersBadgeCount : 0;

        return (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            activeOpacity={0.85}
            onPress={() => handleNavigate(item)}
            disabled={isDisabled || isActive}
          >
            <View style={styles.iconWrapper}>
              <IconComponent
                color={isActive ? colors.white : 'rgba(255, 255, 255, 0.7)'}
                size={moderateScale(24)}
                strokeWidth={isActive ? 2.4 : 2}
              />
              {badgeCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

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

