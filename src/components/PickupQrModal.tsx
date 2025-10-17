import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { createQrMatrix } from '../utils/createQrMatrix';

interface PickupQrModalProps {
  visible: boolean;
  pickupToken: string;
  onDismiss: () => void;
}

const QUIET_ZONE_MODULES = 4;
const QR_SIZE = moderateScale(240);

export const PickupQrModal: React.FC<PickupQrModalProps> = ({ visible, pickupToken, onDismiss }) => {
  if (!pickupToken) {
    return null;
  }

  const matrix = useMemo(() => createQrMatrix(pickupToken), [pickupToken]);
  const moduleCount = matrix.length;
  const totalModules = moduleCount + QUIET_ZONE_MODULES * 2;
  const cellSize = QR_SIZE / totalModules;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
          <View />
        </Pressable>
        <View style={styles.content}>
          <Text style={styles.title}>Pickup QR Code</Text>
          <View style={styles.qrWrapper}>
            <Svg width={QR_SIZE} height={QR_SIZE}>
              <Rect width={QR_SIZE} height={QR_SIZE} fill={colors.white} />
              {matrix.map((row, rowIndex) =>
                row.map((isDark, columnIndex) =>
                  isDark ? (
                    <Rect
                      key={`${rowIndex}-${columnIndex}`}
                      x={(columnIndex + QUIET_ZONE_MODULES) * cellSize}
                      y={(rowIndex + QUIET_ZONE_MODULES) * cellSize}
                      width={cellSize}
                      height={cellSize}
                      fill={colors.navy}
                    />
                  ) : null
                )
              )}
            </Svg>
          </View>
          <Text style={styles.caption}>Show this code to the driver to confirm pickup.</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={styles.closeLabel}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 19, 41, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(24),
  },
  content: {
    width: '100%',
    maxWidth: moderateScale(360),
    borderRadius: moderateScale(28),
    backgroundColor: colors.white,
    paddingVertical: moderateScale(24),
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.navy,
    marginBottom: moderateScale(20),
    textAlign: 'center',
  },
  qrWrapper: {
    width: QR_SIZE,
    height: QR_SIZE,
    backgroundColor: colors.white,
    borderRadius: moderateScale(18),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: moderateScale(18),
    textAlign: 'center',
  },
  closeButton: {
    marginTop: moderateScale(22),
    backgroundColor: colors.primary,
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(24),
  },
  closeLabel: {
    ...typography.bodyStrong,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
