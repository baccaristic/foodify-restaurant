import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { ArrowRight, CalendarClock, LogOut, ScrollText, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface SettingsSidebarProps {
  visible: boolean;
  onClose: () => void;
  onNavigateOperatingHours: () => void;
  onNavigateRestaurantInfo?: () => void;
  onLogout: () => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  visible,
  onClose,
  onNavigateOperatingHours,
  onNavigateRestaurantInfo,
  onLogout,
}) => {
  const handleNavigateRestaurantInfo = () => {
    onClose();
    onNavigateRestaurantInfo?.();
  };

  const handleNavigateOperatingHours = () => {
    onClose();
    onNavigateOperatingHours();
  };

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sidebar}>
              <View style={styles.headerRow}>
                <Text style={styles.brandTitle}>Torii Sushi</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X color={colors.primary} size={moderateScale(20)} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
              <Text style={styles.subtitle}>Manage your restaurant account</Text>

              <View style={styles.menuList}>
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.85}
                  onPress={handleNavigateRestaurantInfo}
                >
                  <View style={styles.menuIconWrapper}>
                    <ScrollText color={colors.primary} size={moderateScale(22)} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.menuLabel}>Restaurant Information</Text>
                  <ArrowRight color={colors.primary} size={moderateScale(18)} strokeWidth={2.4} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.85}
                  onPress={handleNavigateOperatingHours}
                >
                  <View style={styles.menuIconWrapper}>
                    <CalendarClock color={colors.primary} size={moderateScale(22)} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.menuLabel}>Operating Hours</Text>
                  <ArrowRight color={colors.primary} size={moderateScale(18)} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={styles.logoutLabel}>Logout</Text>
                <LogOut color={colors.white} size={moderateScale(18)} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: moderateScale(16),
  },
  sidebar: {
    width: '75%',
    maxWidth: moderateScale(320),
    backgroundColor: colors.white,
    borderRadius: moderateScale(28),
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(28),
    shadowColor: colors.mutedBlack,
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(18),
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandTitle: {
    ...typography.h2,
    fontSize: moderateScale(24),
    color: colors.primary,
  },
  subtitle: {
    marginTop: moderateScale(6),
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  closeButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuList: {
    marginTop: moderateScale(24),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E8EAED',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(18),
    gap: moderateScale(12),
  },
  menuIconWrapper: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: '#F6F8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    ...typography.bodyStrong,
    fontSize: moderateScale(16),
    color: colors.textPrimary,
  },
  logoutButton: {
    marginTop: moderateScale(36),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    backgroundColor: colors.primary,
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(16),
  },
  logoutLabel: {
    ...typography.button,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
