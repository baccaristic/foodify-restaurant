import React, { useCallback, useMemo } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { moderateScale } from 'react-native-size-matters';
import { ArrowLeft, Pencil } from 'lucide-react-native';
import { Image } from 'expo-image';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import type { RootStackParamList } from '../navigation';
import type { MenuItemDTO, OptionGroupDTO } from '../types/api';

const backgroundImage = require('../../assets/background.png');

const formatPrice = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }

  const formatted = value.toLocaleString('fr-TN', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return `${formatted} DT`;
};

export const ViewMenuItemScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ViewMenuItem'>>();
  const item = route.params.item;

  const primaryImage = useMemo(() => {
    const [firstImage] = item.imageUrls ?? [];
    return firstImage ? { uri: firstImage } : null;
  }, [item.imageUrls]);

  const titleInitial = useMemo(() => {
    const firstLetter = item.name?.trim().charAt(0);
    return firstLetter ? firstLetter.toUpperCase() : '?';
  }, [item.name]);

  const formattedPrice = useMemo(() => formatPrice(item.price), [item.price]);
  const formattedPromotionPrice = useMemo(
    () => (item.promotionActive ? formatPrice(item.promotionPrice ?? undefined) : null),
    [item.promotionActive, item.promotionPrice]
  );

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleEdit = useCallback(() => {
    navigation.navigate('AddDish', { menuItem: item, origin: 'view' });
  }, [item, navigation]);

  const renderedCategories = useMemo(() => {
    if (!Array.isArray(item.categories) || item.categories.length === 0) {
      return null;
    }

    return item.categories
      .filter((category) => category?.name?.trim())
      .map((category) => (
        <View key={category.id} style={styles.categoryChip}>
          <Text style={styles.categoryChipText}>{category.name.trim()}</Text>
        </View>
      ));
  }, [item.categories]);

  const categorySummary = useMemo(() => {
    if (!Array.isArray(item.categories) || item.categories.length === 0) {
      return null;
    }

    const labels = item.categories
      .map((category) => category?.name?.trim())
      .filter((name): name is string => Boolean(name));

    return labels.length ? labels.join(', ') : null;
  }, [item.categories]);

  const renderedOptionGroups = useMemo(() => {
    if (!Array.isArray(item.optionGroups) || item.optionGroups.length === 0) {
      return null;
    }

    return (item.optionGroups as OptionGroupDTO[]).map((group) => {
      const minMaxLabel = `Min ${group.minSelect}  •  Max ${group.maxSelect}`;
      return (
        <View key={group.id ?? group.name} style={styles.addonGroup}>
          <View style={styles.addonHeader}>
            <Text style={styles.addonTitle}>{group.name}</Text>
            <Text style={styles.addonLimits}>{minMaxLabel}</Text>
          </View>
          <View style={styles.addonList}>
            {group.extras?.map((extra) => (
              <View key={extra.id ?? extra.name} style={styles.addonRow}>
                <Text style={styles.addonName}>{extra.name}</Text>
                <Text style={styles.addonPrice}>{`+ ${formatPrice(extra.price)}`}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    });
  }, [item.optionGroups]);

  return (
    <ImageBackground source={backgroundImage} style={styles.background} imageStyle={styles.backgroundImage}>
      <View style={styles.overlayContainer}>
        <View pointerEvents="none" style={styles.tintOverlay} />
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack} style={styles.headerButton} activeOpacity={0.85}>
              <ArrowLeft color={colors.primary} size={moderateScale(22)} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Menu</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.card}>
              <View style={styles.imageWrapper}>
                {primaryImage ? (
                  <Image source={primaryImage} style={styles.heroImage} contentFit="cover" />
                ) : (
                  <View style={styles.heroPlaceholder}>
                    <Text style={styles.heroPlaceholderText}>{titleInitial}</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.editButton} onPress={handleEdit} activeOpacity={0.9}>
                  <Pencil color={colors.white} size={moderateScale(16)} />
                  <Text style={styles.editButtonLabel}>edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.titleRow}>
                  <View style={styles.titleColumn}>
                    <Text style={styles.dishName}>{item.name}</Text>
                    {item.popular ? <Text style={styles.popularTag}>Popular</Text> : null}
                  </View>
                  {categorySummary ? (
                    <Text style={styles.categoryTitle}>{categorySummary}</Text>
                  ) : null}
                </View>

                {renderedCategories ? (
                  <View style={styles.categorySection}>
                    <Text style={styles.sectionHeading}>Categories</Text>
                    <View style={styles.categoriesRow}>{renderedCategories}</View>
                  </View>
                ) : null}

                <View style={styles.priceSection}>
                  {formattedPromotionPrice ? (
                    <View style={styles.promotionRow}>
                      <Text style={styles.promotionPrice}>{formattedPromotionPrice}</Text>
                      {item.promotionLabel ? (
                        <View style={styles.promotionBadge}>
                          <Text style={styles.promotionBadgeText}>{item.promotionLabel}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                  <View style={styles.priceRow}>
                    {formattedPromotionPrice ? (
                      <Text style={[styles.priceText, styles.strikethrough]}>{formattedPrice}</Text>
                    ) : (
                      <Text style={styles.priceText}>{formattedPrice}</Text>
                    )}
                  </View>
                </View>

                {item.description ? (
                  <View style={styles.descriptionSection}>
                    <Text style={styles.sectionHeading}>Description</Text>
                    <Text style={styles.descriptionText}>{item.description}</Text>
                  </View>
                ) : null}

                {renderedOptionGroups ? (
                  <View style={styles.addonsSection}>
                    <Text style={styles.sectionHeading}>Add-ons</Text>
                    {renderedOptionGroups}
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default ViewMenuItemScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    flex: 1,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(24),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  headerButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: moderateScale(8),
    elevation: 2,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.navy,
  },
  headerSpacer: {
    width: moderateScale(36),
  },
  scrollContent: {
    paddingBottom: moderateScale(32),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(24),
    overflow: 'hidden',
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: moderateScale(16),
    elevation: 4,
  },
  imageWrapper: {
    position: 'relative',
    height: moderateScale(180),
    backgroundColor: 'rgba(23, 33, 58, 0.05)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  heroPlaceholderText: {
    ...typography.h1,
    color: colors.white,
    fontSize: moderateScale(42),
  },
  editButton: {
    position: 'absolute',
    top: moderateScale(16),
    right: moderateScale(16),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    gap: moderateScale(6),
  },
  editButtonLabel: {
    ...typography.bodySmall,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  cardContent: {
    padding: moderateScale(20),
    gap: moderateScale(16),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleColumn: {
    flexShrink: 1,
    gap: moderateScale(4),
  },
  dishName: {
    ...typography.h2,
    color: colors.navy,
  },
  popularTag: {
    ...typography.bodySmall,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  categoryTitle: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    textAlign: 'right',
    flexShrink: 1,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  categorySection: {
    gap: moderateScale(8),
  },
  categoryChip: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(23, 33, 58, 0.08)',
  },
  categoryChipText: {
    ...typography.bodySmall,
    color: colors.navy,
  },
  priceSection: {
    gap: moderateScale(6),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: moderateScale(12),
  },
  priceText: {
    ...typography.h2,
    color: colors.navy,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  promotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  promotionPrice: {
    ...typography.h1,
    color: colors.primary,
    fontSize: moderateScale(32),
  },
  promotionBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(255, 91, 91, 0.12)',
  },
  promotionBadgeText: {
    ...typography.bodySmall,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  descriptionSection: {
    gap: moderateScale(6),
  },
  sectionHeading: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  descriptionText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: moderateScale(20),
  },
  addonsSection: {
    gap: moderateScale(12),
  },
  addonGroup: {
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(23, 33, 58, 0.05)',
    padding: moderateScale(12),
    gap: moderateScale(8),
  },
  addonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addonTitle: {
    ...typography.bodyStrong,
    color: colors.navy,
  },
  addonLimits: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  addonList: {
    gap: moderateScale(6),
  },
  addonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(4),
  },
  addonName: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  addonPrice: {
    ...typography.body,
    color: colors.primary,
  },
});
