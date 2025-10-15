import React from 'react';
import { View, Text, Switch, StyleSheet, Pressable } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { Image } from 'expo-image';

type Props = {
  name: string;
  isOpen: boolean;
  onToggle: (value: boolean) => void;
  onLogout?: () => void;
};

export const RestaurantHeader: React.FC<Props> = ({ name, isOpen, onToggle, onLogout }) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <View style={styles.logoBadge}>
          <Image source={require('../../assets/torri.png')} contentFit='contain' style={{ width: '100%', height: '100%', borderRadius: moderateScale(24) }}/>
        </View>
        <Text style={styles.restaurantName}>{name}</Text>
      </View>
      <View style={styles.actionsContainer}>
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
        {onLogout ? (
          <Pressable accessibilityRole="button" onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        ) : null}
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
    borderWidth: 2,
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
  actionsContainer: {
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
  logoutButton: {
    marginLeft: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(16),
    backgroundColor: colors.mutedBlack,
  },
  logoutButtonText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
});
