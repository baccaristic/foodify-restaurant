import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  name: string;
  isOpen: boolean;
  onToggle: (value: boolean) => void;
};

export const RestaurantHeader: React.FC<Props> = ({ name, isOpen, onToggle }) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>TORII</Text>
        </View>
        <Text style={styles.restaurantName}>{name}</Text>
      </View>
      <View style={styles.statusContainer}>
        <Text style={[styles.statusLabel, isOpen ? styles.statusOpen : styles.statusClosed]}>
          {isOpen ? 'Open' : 'Closed'}
        </Text>
        <Switch
          value={isOpen}
          onValueChange={onToggle}
          trackColor={{ false: colors.gray, true: colors.primary }}
          thumbColor={colors.white}
          style={styles.statusSwitch}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: moderateScale(12),
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: colors.white,
    borderWidth: moderateScale(2),
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...typography.bodyStrong,
    color: colors.primary,
    letterSpacing: 1.5,
  },
  restaurantName: {
    ...typography.h3,
    marginLeft: moderateScale(12),
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    ...typography.bodyStrong,
  },
  statusOpen: {
    color: colors.primary,
  },
  statusClosed: {
    color: colors.mutedBlack,
  },
  statusSwitch: {
    marginLeft: moderateScale(12),
  },
});
