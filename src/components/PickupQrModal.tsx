import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCodeStyled from 'react-native-qrcode-styled';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface PickupQrModalProps {
  visible: boolean;
  pickupToken: string;
  onDismiss: () => void;
}

const QR_SIZE = moderateScale(240);
const QR_PADDING = moderateScale(16);
const QR_PIECE_SIZE = moderateScale(8);

export const PickupQrModal: React.FC<PickupQrModalProps> = ({ visible, pickupToken, onDismiss }) => {
  if (!pickupToken) {
    return null;
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
          <View />
        </Pressable>
        <View style={styles.content}>
          <Text style={styles.title}>Pickup QR Code</Text>
          <View style={styles.qrWrapper}>
            <QRCodeStyled
              data={pickupToken}
              padding={QR_PADDING}
              pieceSize={QR_PIECE_SIZE}
              pieceBorderRadius={moderateScale(2)}
              color={colors.navy}
              backgroundColor={colors.white}
              style={styles.qr}
            />
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
  qr: {
    width: '100%',
    aspectRatio: 1,
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
