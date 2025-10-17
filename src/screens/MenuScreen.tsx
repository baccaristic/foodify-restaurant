import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { moderateScale } from 'react-native-size-matters';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { restaurantApi } from '../api/restaurantApi';
import type { CategoryDTO, MenuItemDTO } from '../types/api';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation';
import { API_BASE_URL } from '../api';

const backgroundImage = require('../../assets/background.png');

export const MenuScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<'all' | number>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilityUpdatingIds, setAvailabilityUpdatingIds] = useState<Record<number, boolean>>({});

  const loadMenu = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [menuResult, categoryResult] = await Promise.allSettled([
        restaurantApi.getMenu(),
        restaurantApi.getCategories(),
      ]);

      if (menuResult.status === 'fulfilled') {
        setMenuItems(menuResult.value);
      } else {
        throw menuResult.reason;
      }

      if (categoryResult.status === 'fulfilled') {
        const sanitizedCategories = categoryResult.value
          .filter((category) => category.name?.trim().length)
          .map((category) => ({ ...category, name: category.name.trim() }));
        sanitizedCategories.sort((a, b) => a.name.localeCompare(b.name));
        setCategories(sanitizedCategories);
      } else {
        setCategories([]);
      }
    } catch (err) {
      setMenuItems([]);
      setCategories([]);
      setActiveCategoryId('all');
      setError('Unable to load your menu right now.');
    } finally {
      if (options.silent) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMenu();
    }, [loadMenu])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadMenu({ silent: true });
  }, [loadMenu]);

  const handleRetry = useCallback(() => {
    void loadMenu();
  }, [loadMenu]);

  const derivedCategories = useMemo(() => {
    const categoryMap = new Map<number, string>();

    categories.forEach((category) => {
      if (category.name?.trim()) {
        categoryMap.set(category.id, category.name.trim());
      }
    });

    menuItems.forEach((item) => {
      item.categories?.forEach((category) => {
        if (category?.name?.trim()) {
          categoryMap.set(category.id, category.name.trim());
        }
      });
    });

    return Array.from(categoryMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, menuItems]);

  useEffect(() => {
    setActiveCategoryId((previous) => {
      if (previous === 'all') {
        return previous;
      }

      const stillExists = derivedCategories.some((category) => category.id === previous);
      if (stillExists) {
        return previous;
      }

      return derivedCategories.length > 0 ? derivedCategories[0].id : 'all';
    });
  }, [derivedCategories]);

  const filteredItems = useMemo(() => {
    if (activeCategoryId === 'all') {
      return menuItems;
    }

    return menuItems.filter((item) =>
      item.categories?.some((category) => category.id === activeCategoryId)
    );
  }, [activeCategoryId, menuItems]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAddDish = useCallback(() => {
    navigation.navigate('AddDish');
  }, [navigation]);

  const handleViewItem = useCallback(
    (item: MenuItemDTO) => {
      navigation.navigate('ViewMenuItem', { item });
    },
    [navigation]
  );

  const handleToggleAvailability = useCallback(async (menuId: number, nextValue: boolean) => {
    let previousAvailability: boolean | undefined;

    setAvailabilityUpdatingIds((prev) => ({ ...prev, [menuId]: true }));

    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === menuId) {
          previousAvailability = item.available;
          return { ...item, available: nextValue };
        }

        return item;
      })
    );

    try {
      await restaurantApi.updateMenuAvailability(menuId, nextValue);
    } catch (err) {
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === menuId && previousAvailability !== undefined
            ? { ...item, available: previousAvailability }
            : item
        )
      );
      Alert.alert('Update failed', 'Unable to update availability. Please try again.');
    } finally {
      setAvailabilityUpdatingIds((prev) => {
        const updated = { ...prev };
        delete updated[menuId];
        return updated;
      });
    }
  }, []);

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlayContainer}>
        <View pointerEvents="none" style={styles.tintOverlay} />
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton} activeOpacity={0.85}>
              <ArrowLeft color={colors.navy} size={moderateScale(22)} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Menu</Text>
            <View style={styles.headerSpacer} />
          </View>

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleRetry} style={styles.retryButton} activeOpacity={0.85}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
              }
            >
              {menuItems.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryTabs}
                >
                  <TouchableOpacity
                    key="all"
                    onPress={() => setActiveCategoryId('all')}
                    activeOpacity={0.85}
                    style={[styles.categoryChip, activeCategoryId === 'all' && styles.categoryChipActive]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        activeCategoryId === 'all' && styles.categoryChipTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>

                  {derivedCategories.map((category) => {
                    const isActive = category.id === activeCategoryId;
                    return (
                      <TouchableOpacity
                        key={category.id}
                        onPress={() => setActiveCategoryId(category.id)}
                        activeOpacity={0.85}
                        style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                      >
                        <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <View style={styles.section}>
                {filteredItems.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateTitle}>No dishes yet</Text>
                    <Text style={styles.emptyStateSubtitle}>
                      Add your first dish to start building your restaurant menu.
                    </Text>
                  </View>
                ) : (
                  filteredItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onPress={handleViewItem}
                      onToggleAvailability={handleToggleAvailability}
                      isUpdatingAvailability={Boolean(availabilityUpdatingIds[item.id])}
                    />
                  ))
                )}
              </View>
            </ScrollView>
          )}

          <TouchableOpacity style={styles.addButton} activeOpacity={0.9} onPress={handleAddDish}>
            <Plus color={colors.white} size={moderateScale(20)} />
            <Text style={styles.addButtonText}>Add a Dish</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

type MenuItemCardProps = {
  item: MenuItemDTO;
  onPress: (item: MenuItemDTO) => void;
  onToggleAvailability: (menuId: number, nextValue: boolean) => void;
  isUpdatingAvailability: boolean;
};

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onPress,
  onToggleAvailability,
  isUpdatingAvailability,
}) => {
  const imageSource = useMemo(() => {
    const [primaryImage] = item.imageUrls ?? [];
    return primaryImage ? { uri: `${API_BASE_URL}/auth/image/${primaryImage}` } : null;
  }, [item.imageUrls]);
  const placeholderInitial = useMemo(() => {
    const firstLetter = item.name?.trim().charAt(0);
    return firstLetter ? firstLetter.toUpperCase() : '?';
  }, [item.name]);
  const formattedPrice = useMemo(() => {
    return typeof item.price === 'number' ? `${item.price.toFixed(2)} DT` : '--';
  }, [item.price]);
  const categoryLabels = useMemo(() => {
    if (!Array.isArray(item.categories)) {
      return null;
    }

    const labels = item.categories
      .map((category) => category?.name?.trim())
      .filter((name): name is string => Boolean(name));

    if (labels.length === 0) {
      return null;
    }

    return labels.join(' • ');
  }, [item.categories]);

  const availabilityStatusLabel = useMemo(() => {
    if (isUpdatingAvailability) {
      return 'Updating...';
    }

    return item.available ? 'Available' : 'Unavailable';
  }, [isUpdatingAvailability, item.available]);

  const handleAvailabilityChange = useCallback(
    (value: boolean) => {
      onToggleAvailability(item.id, value);
    },
    [item.id, onToggleAvailability]
  );

  return (
    <View style={styles.menuCard}>
      <View style={styles.menuCardHeader}>
        <View style={styles.availabilityToggle}>
          <Text
            style={[
              styles.availabilityStatus,
              isUpdatingAvailability
                ? styles.availabilityStatusUpdating
                : item.available
                ? styles.availabilityStatusAvailable
                : styles.availabilityStatusUnavailable,
            ]}
          >
            {availabilityStatusLabel}
          </Text>
          <Switch
            value={item.available}
            onValueChange={handleAvailabilityChange}
            disabled={isUpdatingAvailability}
            trackColor={{ false: '#CBD5E1', true: colors.success }}
            thumbColor={
              isUpdatingAvailability ? '#f1f5f9' : item.available ? colors.success : '#f1f5f9'
            }
            ios_backgroundColor="#CBD5E1"
            style={styles.availabilitySwitch}
          />
        </View>
        <TouchableOpacity style={styles.deleteButton} activeOpacity={0.85}>
          <Trash2 color={colors.primary} size={moderateScale(16)} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.menuCardBody}
        activeOpacity={0.88}
        onPress={() => onPress(item)}
      >
        <View style={styles.menuCardImageWrapper}>
          {imageSource ? (
            <Image source={imageSource} style={styles.menuCardImage} contentFit="cover" />
          ) : (
            <View style={styles.menuCardPlaceholder}>
              <Text style={styles.menuCardPlaceholderText}>{placeholderInitial}</Text>
            </View>
          )}
        </View>
        <View style={styles.menuCardContent}>
          <Text style={styles.menuCardTitle}>{item.name}</Text>
          {item.description ? <Text style={styles.menuCardDescription}>{item.description}</Text> : null}
          {categoryLabels ? <Text style={styles.menuCardCategories}>{categoryLabels}</Text> : null}
          <Text style={styles.menuCardPrice}>{formattedPrice}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

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
  backButton: {
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
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
  },
  errorText: {
    ...typography.bodyMedium,
    color: '#E53935',
    textAlign: 'center',
    marginBottom: moderateScale(16),
  },
  retryButton: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    ...typography.button,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: moderateScale(24),
  },
  categoryTabs: {
    paddingVertical: moderateScale(12),
    paddingRight: moderateScale(10),
  },
  categoryChip: {
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: moderateScale(10),
    backgroundColor: colors.white,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  section: {
    gap: moderateScale(16),
  },
  emptyStateContainer: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  emptyStateTitle: {
    ...typography.bodyStrong,
    color: colors.navy,
    marginBottom: moderateScale(8),
  },
  emptyStateSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(24),
    padding: moderateScale(18),
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.navy,
    shadowOpacity: 0.04,
    shadowRadius: moderateScale(10),
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  menuCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  availabilitySwitch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  availabilityStatus: {
    ...typography.bodySmall,
  },
  availabilityStatusAvailable: {
    color: colors.success,
  },
  availabilityStatusUnavailable: {
    color: colors.primary,
  },
  availabilityStatusUpdating: {
    color: colors.textSecondary,
  },
  deleteButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#FFECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(12),
  },
  menuCardImageWrapper: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    marginRight: moderateScale(16),
  },
  menuCardImage: {
    width: '100%',
    height: '100%',
  },
  menuCardPlaceholder: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCardPlaceholderText: {
    ...typography.h2,
    color: colors.primary,
  },
  menuCardContent: {
    flex: 1,
    gap: moderateScale(6),
  },
  menuCardTitle: {
    ...typography.bodyStrong,
    color: colors.navy,
  },
  menuCardDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  menuCardCategories: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: moderateScale(2),
  },
  menuCardPrice: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  addButton: {
    marginTop: moderateScale(12),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: moderateScale(10),
  },
  addButtonText: {
    ...typography.button,
  },
});
