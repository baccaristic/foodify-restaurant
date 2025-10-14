import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  title: string;
  variant?: 'menu' | 'orders';
};

export const QuickActionCard: React.FC<Props> = ({ title, variant = 'menu' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>{variant === 'menu' ? <MenuIcon /> : <OrdersIcon />}</View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const MenuIcon = () => (
  <View style={styles.menuIconContainer}>
    <View style={[styles.menuLine, styles.menuLineSpacing]} />
    <View style={[styles.menuLine, styles.menuLineShort, styles.menuLineSpacing]} />
    <View style={styles.menuLine} />
  </View>
);

const OrdersIcon = () => (
  <View style={styles.ordersIconContainer}>
    <View style={styles.ordersReceipt}>
      <View style={[styles.ordersLine, styles.ordersLineSpacing]} />
      <View style={[styles.ordersLine, styles.ordersLineShort, styles.ordersLineSpacing]} />
      <View style={styles.ordersLine} />
    </View>
    <View style={styles.ordersStub} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(24),
  },
  iconWrapper: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.button,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: moderateScale(12),
  },
  menuIconContainer: {
    alignItems: 'center',
  },
  menuLine: {
    width: moderateScale(28),
    height: moderateScale(3),
    backgroundColor: colors.primary,
    borderRadius: moderateScale(2),
  },
  menuLineShort: {
    width: moderateScale(20),
  },
  menuLineSpacing: {
    marginBottom: moderateScale(6),
  },
  ordersIconContainer: {
    alignItems: 'center',
  },
  ordersReceipt: {
    width: moderateScale(32),
    borderRadius: moderateScale(6),
    backgroundColor: colors.white,
    borderWidth: moderateScale(2),
    borderColor: colors.primary,
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(6),
  },
  ordersLine: {
    height: moderateScale(3),
    backgroundColor: colors.primary,
    borderRadius: moderateScale(2),
  },
  ordersLineShort: {
    width: '70%',
  },
  ordersLineSpacing: {
    marginBottom: moderateScale(4),
  },
  ordersStub: {
    width: moderateScale(16),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: colors.primary,
    marginTop: moderateScale(6),
  },
});
