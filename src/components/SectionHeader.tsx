import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { typography } from '../theme/typography';

type Props = {
  title: string;
  trailing?: React.ReactNode;
};

export const SectionHeader: React.FC<Props> = ({ title, trailing }) => {
  return (
    <View style={styles.container}>
      <Text style={typography.h2}>{title}</Text>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  trailing: {
    marginLeft: moderateScale(12),
  },
});
