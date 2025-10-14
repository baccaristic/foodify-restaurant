import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type Props = {
  orderNumber: number;
  items: number;
  total: number;
  onPress?: () => void;
};

export const OrderCard: React.FC<Props> = ({ orderNumber, items, total, onPress }) => {
  return (
    <View style={styles.container}>
      <Text style={typography.inverseTitle}>{`Order N°${orderNumber}`}</Text>
      <Text style={[typography.inverseBody, styles.detailText]}>{`${items} Items`}</Text>
      <Text style={[typography.inverseBody, styles.detailText]}>{`${total} DT`}</Text>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.button}>
        <Text style={typography.button}>Order Details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navy,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    width: moderateScale(220),
  },
  detailText: {
    marginTop: moderateScale(6),
  },
  button: {
    marginTop: moderateScale(16),
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(10),
    alignItems: 'center',
  },
});
