import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
//@ts-ignore
import MenuIcon from '../../assets/icons/menu.svg';
//@ts-ignore
import OrdersIcon from '../../assets/icons/orders.svg';

type Props = {
  title: string;
  variant?: 'menu' | 'orders';
  onPress?: () => void;
};

export const QuickActionCard: React.FC<Props> = ({ title, variant = 'menu', onPress }) => {
  const Icon = variant === 'menu' ? MenuIcon : OrdersIcon;

  return (
    <TouchableOpacity
      style={styles.touchable}
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <Icon width={moderateScale(32)} height={moderateScale(48)} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.button,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: moderateScale(12),
  },
});
