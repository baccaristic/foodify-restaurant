import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  title: string;
  value: string;
  unit?: string;
  change?: string;
};

export const StatisticCard: React.FC<Props> = ({ title, value, unit, change }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {change ? <Text style={styles.change}>{change}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(16),
  },
  title: {
    ...typography.inverseBody,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    color: colors.gray,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: moderateScale(12),
  },
  value: {
    ...typography.inverseTitle,
    fontSize: moderateScale(28),
  },
  unit: {
    ...typography.inverseBody,
    marginLeft: moderateScale(6),
    marginBottom: moderateScale(4),
  },
  change: {
    ...typography.bodySmall,
    color: colors.success,
    marginTop: moderateScale(12),
  },
});
