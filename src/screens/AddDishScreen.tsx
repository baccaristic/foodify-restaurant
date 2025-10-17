import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { moderateScale } from 'react-native-size-matters';
import { ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { restaurantApi } from '../api/restaurantApi';
import type { RootStackParamList } from '../navigation';
import type { CategoryDTO, OptionGroupRequestDTO } from '../types/api';

const backgroundImage = require('../../assets/background.png');

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

interface ExtraForm {
  id: string;
  name: string;
  price: string;
}

interface OptionGroupForm {
  id: string;
  name: string;
  minSelect: string;
  maxSelect: string;
  extras: ExtraForm[];
}

export const AddDishScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoriesModal, setShowEditCategoriesModal] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [optionGroups, setOptionGroups] = useState<OptionGroupForm[]>([]);
  const [showManageAddonsModal, setShowManageAddonsModal] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const selectedCategories = useMemo(
    () => sortedCategories.filter((category) => selectedCategoryIds.includes(category.id)),
    [selectedCategoryIds, sortedCategories]
  );

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    setCategoriesError(null);

    try {
      const response = await restaurantApi.getCategories();
      const sanitized = response
        .filter((category) => category.name?.trim().length)
        .map((category) => ({ ...category, name: category.name.trim() }));
      setCategories(sanitized);
      setSelectedCategoryIds((prev) =>
        prev.filter((id) => sanitized.some((category) => category.id === id))
      );
    } catch (error) {
      setCategories([]);
      setCategoriesError('Unable to load categories right now.');
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleToggleCategory = useCallback(
    (categoryId: number) => {
      setSelectedCategoryIds((previous) => {
        if (previous.includes(categoryId)) {
          return previous.filter((id) => id !== categoryId);
        }

        return [...previous, categoryId];
      });
      setCategoriesError(null);
      setSubmitError(null);
    },
    []
  );

  const handleOpenAddCategoryModal = useCallback(() => {
    setShowAddCategoryModal(true);
  }, []);

  const handleCloseAddCategoryModal = useCallback(() => {
    setShowAddCategoryModal(false);
  }, []);

  const handleOpenEditCategoriesModal = useCallback(() => {
    setShowEditCategoriesModal(true);
  }, []);

  const handleCloseEditCategoriesModal = useCallback(() => {
    setShowEditCategoriesModal(false);
  }, []);

  const handleOpenAddonModal = useCallback((groupId: string | null = null) => {
    setActiveGroupId(groupId);
    setShowAddonModal(true);
  }, []);

  const handleCloseAddonModal = useCallback(() => {
    setActiveGroupId(null);
    setShowAddonModal(false);
  }, []);

  const handleOpenManageAddons = useCallback(() => {
    setShowManageAddonsModal(true);
  }, []);

  const handleCloseManageAddons = useCallback(() => {
    setShowManageAddonsModal(false);
  }, []);

  const handleRemoveGroup = useCallback((groupId: string) => {
    setOptionGroups((prev) => prev.filter((group) => group.id !== groupId));
    setSubmitError(null);
  }, []);

  const upsertGroup = useCallback((group: OptionGroupForm) => {
    setOptionGroups((prev) => {
      const exists = prev.some((item) => item.id === group.id);
      if (exists) {
        return prev.map((item) => (item.id === group.id ? group : item));
      }
      return [...prev, group];
    });
    setSubmitError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmedName = dishName.trim();
    const trimmedDescription = description.trim();
    const trimmedImageUrl = imageUrl.trim();

    const errors: { name?: string; description?: string } = {};

    if (!trimmedName) {
      errors.name = 'Dish name is required.';
    }

    if (!trimmedDescription) {
      errors.description = 'Dish description is required.';
    }

    if (selectedCategoryIds.length === 0) {
      setCategoriesError('Please choose at least one category.');
    }

    if (Object.keys(errors).length > 0 || selectedCategoryIds.length === 0) {
      setFieldErrors(errors);
      return;
    }

    const optionPayload: OptionGroupRequestDTO[] = [];

    for (const group of optionGroups) {
      const trimmedGroupName = group.name.trim();
      const parsedMin = Number.parseInt(group.minSelect, 10);
      const parsedMax = Number.parseInt(group.maxSelect, 10);

      if (!trimmedGroupName) {
        setSubmitError('Every add-on group needs a name.');
        return;
      }

      if (!Number.isFinite(parsedMin) || !Number.isFinite(parsedMax) || parsedMin < 0 || parsedMax < 0) {
        setSubmitError('Add-on limits must be positive numbers.');
        return;
      }

      if (parsedMin > parsedMax) {
        setSubmitError('Min selections cannot exceed max selections.');
        return;
      }

      const extras: OptionGroupRequestDTO['extras'] = [];

      for (const extra of group.extras) {
        const trimmedExtraName = extra.name.trim();
        const normalizedPrice = extra.price.replace(',', '.');
        const parsedPrice = normalizedPrice.length ? Number.parseFloat(normalizedPrice) : 0;

        if (!trimmedExtraName) {
          setSubmitError('Every add-on needs a name.');
          return;
        }

        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
          setSubmitError('Extra charges must be zero or greater.');
          return;
        }

        extras.push({
          name: trimmedExtraName,
          price: parsedPrice,
          isDefault: false,
        });
      }

      if (extras.length === 0) {
        setSubmitError('Add at least one add-on option.');
        return;
      }

      optionPayload.push({
        id: group.id.includes('-') ? undefined : Number.parseInt(group.id, 10),
        name: trimmedGroupName,
        minSelect: parsedMin,
        maxSelect: parsedMax,
        required: false,
        extras,
      });
    }

    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await restaurantApi.addMenuItem(
        {
          name: trimmedName,
          description: trimmedDescription,
          price: 0,
          categories: selectedCategoryIds,
          popular: false,
          promotionActive: false,
          promotionLabel: null,
          promotionPrice: null,
          imageUrls: trimmedImageUrl ? [trimmedImageUrl] : undefined,
          optionGroups: optionPayload.length ? optionPayload : undefined,
        },
        undefined
      );

      Alert.alert('Dish added', 'Your dish was added to your menu.', [
        { text: 'Back to menu', onPress: handleGoBack },
      ]);
    } catch (error) {
      setSubmitError('Unable to add your dish right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    description,
    dishName,
    handleGoBack,
    imageUrl,
    optionGroups,
    selectedCategoryIds,
  ]);

  const activeGroup = useMemo(
    () => optionGroups.find((group) => group.id === activeGroupId) ?? null,
    [activeGroupId, optionGroups]
  );

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
            <TouchableOpacity
              onPress={handleGoBack}
              style={styles.headerButton}
              activeOpacity={0.85}
              disabled={isSubmitting}
            >
              <ArrowLeft color={colors.primary} size={moderateScale(22)} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Menu</Text>
            <View style={styles.headerSpacer} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoider}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Dish name</Text>
                <TextInput
                  value={dishName}
                  onChangeText={(text) => {
                    setDishName(text);
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                    setSubmitError(null);
                  }}
                  placeholder="dish name"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, fieldErrors.name && styles.inputError]}
                  autoCapitalize="words"
                  editable={!isSubmitting}
                />
                {fieldErrors.name ? <Text style={styles.errorText}>{fieldErrors.name}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Dish description</Text>
                <TextInput
                  value={description}
                  onChangeText={(text) => {
                    setDescription(text);
                    setFieldErrors((prev) => ({ ...prev, description: undefined }));
                    setSubmitError(null);
                  }}
                  placeholder="Description"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, styles.multilineInput, fieldErrors.description && styles.inputError]}
                  multiline
                  textAlignVertical="top"
                  numberOfLines={4}
                  editable={!isSubmitting}
                />
                {fieldErrors.description ? (
                  <Text style={styles.errorText}>{fieldErrors.description}</Text>
                ) : null}
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>Category</Text>
                  <View style={styles.sectionActions}>
                    <TouchableOpacity
                      style={styles.sectionAction}
                      onPress={handleOpenAddCategoryModal}
                      activeOpacity={0.85}
                      disabled={isSubmitting}
                    >
                      <Plus color={colors.primary} size={moderateScale(16)} />
                      <Text style={styles.sectionActionText}>add Category</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sectionAction, styles.sectionActionSpacing]}
                      onPress={handleOpenEditCategoriesModal}
                      activeOpacity={0.85}
                      disabled={isSubmitting || selectedCategoryIds.length === 0}
                    >
                      <Pencil color={colors.primary} size={moderateScale(16)} />
                      <Text style={styles.sectionActionText}>edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.categoryChips}>
                  {isLoadingCategories ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : sortedCategories.length === 0 ? (
                    <Text style={styles.emptyText}>No categories yet.</Text>
                  ) : (
                    sortedCategories.map((category) => {
                      const isSelected = selectedCategoryIds.includes(category.id);
                      return (
                        <TouchableOpacity
                          key={category.id}
                          onPress={() => handleToggleCategory(category.id)}
                          style={[styles.chip, isSelected && styles.chipSelected]}
                          activeOpacity={0.85}
                          disabled={isSubmitting}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>

                {categoriesError ? <Text style={styles.errorText}>{categoriesError}</Text> : null}
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>Add-ons</Text>
                  <View style={styles.sectionActions}>
                    <TouchableOpacity
                      style={styles.sectionAction}
                      onPress={() => handleOpenAddonModal(null)}
                      activeOpacity={0.85}
                      disabled={isSubmitting}
                    >
                      <Plus color={colors.primary} size={moderateScale(16)} />
                      <Text style={styles.sectionActionText}>add modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sectionAction, styles.sectionActionSpacing]}
                      onPress={handleOpenManageAddons}
                      activeOpacity={0.85}
                      disabled={isSubmitting || optionGroups.length === 0}
                    >
                      <Pencil color={colors.primary} size={moderateScale(16)} />
                      <Text style={styles.sectionActionText}>edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {optionGroups.length === 0 ? (
                  <Text style={styles.emptyText}>No add-ons yet.</Text>
                ) : (
                  <View style={styles.categoryChips}>
                    {optionGroups.map((group) => (
                      <TouchableOpacity
                        key={group.id}
                        style={styles.chip}
                        onPress={() => handleOpenAddonModal(group.id)}
                        activeOpacity={0.85}
                        disabled={isSubmitting}
                      >
                        <Text style={styles.chipText}>{group.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>Image</Text>
                <View style={styles.uploadArea}>
                  <TextInput
                    value={imageUrl}
                    onChangeText={(text) => {
                      setImageUrl(text);
                      setSubmitError(null);
                    }}
                    style={styles.uploadInput}
                    placeholder="Upload image"
                    placeholderTextColor={colors.primary}
                    editable={!isSubmitting}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.ctaButton, styles.cancelButton]}
                  onPress={handleGoBack}
                  activeOpacity={0.85}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.ctaText, styles.cancelText]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ctaButton, styles.saveButton, isSubmitting && styles.disabledButton]}
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={[styles.ctaText, styles.saveText]}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>

        <AddCategoryModal
          visible={showAddCategoryModal}
          onClose={handleCloseAddCategoryModal}
          onCreated={(category) => {
            setCategories((prev) => {
              const exists = prev.some((item) => item.id === category.id);
              if (exists) {
                return prev.map((item) => (item.id === category.id ? category : item));
              }
              return [...prev, category];
            });
            setSelectedCategoryIds((prev) =>
              prev.includes(category.id) ? prev : [...prev, category.id]
            );
            setCategoriesError(null);
            setSubmitError(null);
          }}
        />

        <EditCategoriesModal
          visible={showEditCategoriesModal}
          onClose={handleCloseEditCategoriesModal}
          categories={selectedCategories}
          onRemove={(id) => {
            setSelectedCategoryIds((prev) => prev.filter((categoryId) => categoryId !== id));
            setCategoriesError(null);
            setSubmitError(null);
          }}
          onCreate={(category) => {
            setCategories((prev) => {
              const exists = prev.some((item) => item.id === category.id);
              if (exists) {
                return prev.map((item) => (item.id === category.id ? category : item));
              }
              return [...prev, category];
            });
            setSelectedCategoryIds((prev) =>
              prev.includes(category.id) ? prev : [...prev, category.id]
            );
            setCategoriesError(null);
            setSubmitError(null);
          }}
        />

        <AddonModal
          visible={showAddonModal}
          onClose={handleCloseAddonModal}
          onSave={(group) => {
            upsertGroup(group);
            handleCloseAddonModal();
          }}
          existingGroup={activeGroup}
        />

        <ManageAddonsModal
          visible={showManageAddonsModal}
          onClose={handleCloseManageAddons}
          groups={optionGroups}
          onEdit={(groupId) => {
            handleCloseManageAddons();
            handleOpenAddonModal(groupId);
          }}
          onRemove={(groupId) => {
            handleRemoveGroup(groupId);
          }}
        />
      </View>
    </ImageBackground>
  );
};

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (category: CategoryDTO) => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ visible, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setName('');
      setError(null);
      setIsCreating(false);
    }
  }, [visible]);

  const handleCreate = useCallback(
    async (closeAfter: boolean) => {
      const trimmed = name.trim();
      if (!trimmed) {
        setError('Category name is required.');
        return;
      }

      setIsCreating(true);
      setError(null);

      try {
        const created = await restaurantApi.createCategory(trimmed);
        onCreated({ ...created, name: created.name.trim() });
        setName('');
        if (closeAfter) {
          onClose();
        }
      } catch (err) {
        setError('Unable to save category.');
      } finally {
        setIsCreating(false);
      }
    },
    [name, onClose, onCreated]
  );

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add category</Text>
            <TouchableOpacity onPress={onClose} hitSlop={styles.hitSlop}>
              <X color={colors.primary} size={moderateScale(18)} />
            </TouchableOpacity>
          </View>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            placeholder="Category name"
            placeholderTextColor={colors.textSecondary}
            style={styles.modalInput}
            editable={!isCreating}
          />
          {error ? <Text style={styles.modalError}>{error}</Text> : null}
          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalGhostButton]}
              onPress={() => handleCreate(false)}
              activeOpacity={0.85}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[styles.modalButtonText, styles.modalGhostText]}>add another</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalPrimaryButton]}
              onPress={() => handleCreate(true)}
              activeOpacity={0.85}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={[styles.modalButtonText, styles.modalPrimaryText]}>add and save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface EditCategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  categories: CategoryDTO[];
  onRemove: (id: number) => void;
  onCreate: (category: CategoryDTO) => void;
}

const EditCategoriesModal: React.FC<EditCategoriesModalProps> = ({
  visible,
  onClose,
  categories,
  onRemove,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setName('');
      setError(null);
      setIsSaving(false);
    }
  }, [visible]);

  const handleCreate = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Category name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const created = await restaurantApi.createCategory(trimmed);
      onCreate({ ...created, name: created.name.trim() });
      setName('');
    } catch (err) {
      setError('Unable to create category.');
    } finally {
      setIsSaving(false);
    }
  }, [name, onCreate]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit category</Text>
            <TouchableOpacity onPress={onClose} hitSlop={styles.hitSlop}>
              <X color={colors.primary} size={moderateScale(18)} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {categories.length === 0 ? (
              <Text style={styles.emptyText}>No categories selected.</Text>
            ) : (
              categories.map((category) => (
                <View key={category.id} style={styles.modalListItem}>
                  <Text style={styles.modalListText}>{category.name}</Text>
                  <TouchableOpacity onPress={() => onRemove(category.id)} hitSlop={styles.hitSlop}>
                    <Trash2 color={colors.primary} size={moderateScale(18)} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.modalInlineRow}>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError(null);
              }}
              placeholder="Add. Ex Drinks"
              placeholderTextColor={colors.textSecondary}
              style={[styles.modalInput, styles.modalInlineInput]}
              editable={!isSaving}
            />
            <TouchableOpacity
              style={[styles.inlineAddButton, isSaving && styles.disabledButton]}
              onPress={handleCreate}
              activeOpacity={0.85}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Plus color={colors.white} size={moderateScale(16)} />
              )}
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.modalError}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.modalButton, styles.modalPrimaryButton, styles.modalFullWidthButton]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={[styles.modalButtonText, styles.modalPrimaryText]}>save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

interface AddonModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (group: OptionGroupForm) => void;
  existingGroup: OptionGroupForm | null;
}

const AddonModal: React.FC<AddonModalProps> = ({ visible, onClose, onSave, existingGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [addonName, setAddonName] = useState('');
  const [extraCharge, setExtraCharge] = useState('');
  const [minSelect, setMinSelect] = useState('0');
  const [maxSelect, setMaxSelect] = useState('0');
  const [extras, setExtras] = useState<ExtraForm[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (existingGroup) {
        setGroupName(existingGroup.name);
        setMinSelect(existingGroup.minSelect);
        setMaxSelect(existingGroup.maxSelect);
        setExtras(existingGroup.extras);
      } else {
        setGroupName('');
        setMinSelect('0');
        setMaxSelect('0');
        setExtras([]);
      }
      setAddonName('');
      setExtraCharge('');
      setError(null);
    } else {
      setAddonName('');
      setExtraCharge('');
    }
  }, [existingGroup, visible]);

  const handleAddExtra = useCallback(() => {
    const trimmedName = addonName.trim();
    if (!trimmedName) {
      setError('Add-on name is required.');
      return;
    }

    setExtras((prev) => [
      ...prev,
      {
        id: createId(),
        name: trimmedName,
        price: extraCharge.trim(),
      },
    ]);

    setAddonName('');
    setExtraCharge('');
    setError(null);
  }, [addonName, extraCharge]);

  const handleRemoveExtra = useCallback((id: string) => {
    setExtras((prev) => prev.filter((extra) => extra.id !== id));
  }, []);

  const handleSave = useCallback(() => {
    const trimmedGroupName = groupName.trim();
    if (!trimmedGroupName) {
      setError('Add-on group is required.');
      return;
    }

    if (extras.length === 0) {
      setError('Add at least one add-on.');
      return;
    }

    const parsedMin = Number.parseInt(minSelect, 10);
    const parsedMax = Number.parseInt(maxSelect, 10);

    if (!Number.isFinite(parsedMin) || !Number.isFinite(parsedMax) || parsedMin < 0 || parsedMax < 0) {
      setError('Min and max selections must be positive numbers.');
      return;
    }

    if (parsedMin > parsedMax) {
      setError('Min selections cannot exceed max selections.');
      return;
    }

    const sanitizedExtras = extras.map((extra) => ({
      ...extra,
      name: extra.name.trim(),
      price: extra.price,
    }));

    onSave({
      id: existingGroup?.id ?? createId(),
      name: trimmedGroupName,
      minSelect,
      maxSelect,
      extras: sanitizedExtras,
    });
  }, [existingGroup?.id, extras, groupName, maxSelect, minSelect, onSave]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCardLarge}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Addons</Text>
            <TouchableOpacity onPress={onClose} hitSlop={styles.hitSlop}>
              <X color={colors.primary} size={moderateScale(18)} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.addonContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>Add-on group *</Text>
              <TextInput
                value={groupName}
                onChangeText={(text) => {
                  setGroupName(text);
                  setError(null);
                }}
                placeholder="Sauce"
                placeholderTextColor={colors.textSecondary}
                style={styles.modalInput}
              />
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>Add-on *</Text>
              <TextInput
                value={addonName}
                onChangeText={(text) => {
                  setAddonName(text);
                  setError(null);
                }}
                placeholder="Ex. Cheesy Sauce"
                placeholderTextColor={colors.textSecondary}
                style={styles.modalInput}
              />
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>Extra charge</Text>
              <TextInput
                value={extraCharge}
                onChangeText={(text) => {
                  setExtraCharge(text);
                  setError(null);
                }}
                placeholder="Eg. 3,000dt"
                placeholderTextColor={colors.textSecondary}
                style={styles.modalInput}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalInlineRow}>
              <View style={styles.modalHalfField}>
                <Text style={styles.modalFieldLabel}>Min</Text>
                <TextInput
                  value={minSelect}
                  onChangeText={(text) => {
                    setMinSelect(text);
                    setError(null);
                  }}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.modalInput}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.modalHalfField}>
                <Text style={styles.modalFieldLabel}>Max</Text>
                <TextInput
                  value={maxSelect}
                  onChangeText={(text) => {
                    setMaxSelect(text);
                    setError(null);
                  }}
                  placeholder="3"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.modalInput}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.inlineAddButton} onPress={handleAddExtra} activeOpacity={0.85}>
              <Text style={styles.inlineAddButtonText}>add</Text>
            </TouchableOpacity>

            <Text style={styles.noteText}>
              NB : keep extra charge empty if you don&apos;t Charge extra money on the add-on
            </Text>

            {extras.map((extra) => {
              const trimmed = extra.price.trim();
              const parsed = trimmed.length
                ? Number.parseFloat(trimmed.replace(',', '.'))
                : 0;
              const hasCharge = trimmed.length > 0 && Number.isFinite(parsed);

              return (
                <View key={extra.id} style={styles.modalListItem}>
                  <View>
                    <Text style={styles.modalListText}>{extra.name}</Text>
                    <Text style={styles.extraPriceText}>
                      {hasCharge ? `+ ${parsed} dt` : '+ 0 dt'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveExtra(extra.id)} hitSlop={styles.hitSlop}>
                    <Trash2 color={colors.primary} size={moderateScale(18)} />
                  </TouchableOpacity>
                </View>
              );
            })}

            {error ? <Text style={styles.modalError}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.modalButton, styles.modalPrimaryButton, styles.modalFullWidthButton]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalButtonText, styles.modalPrimaryText]}>add and save</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

interface ManageAddonsModalProps {
  visible: boolean;
  onClose: () => void;
  groups: OptionGroupForm[];
  onEdit: (groupId: string) => void;
  onRemove: (groupId: string) => void;
}

const ManageAddonsModal: React.FC<ManageAddonsModalProps> = ({
  visible,
  onClose,
  groups,
  onEdit,
  onRemove,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage add-ons</Text>
            <TouchableOpacity onPress={onClose} hitSlop={styles.hitSlop}>
              <X color={colors.primary} size={moderateScale(18)} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {groups.length === 0 ? (
              <Text style={styles.emptyText}>No add-ons yet.</Text>
            ) : (
              groups.map((group) => (
                <View key={group.id} style={styles.modalListItem}>
                  <Text style={styles.modalListText}>{group.name}</Text>
                  <View style={styles.modalListActions}>
                    <TouchableOpacity onPress={() => onEdit(group.id)} hitSlop={styles.hitSlop}>
                      <Pencil color={colors.primary} size={moderateScale(18)} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onRemove(group.id)}
                      hitSlop={styles.hitSlop}
                      style={styles.modalListActionSpacing}
                    >
                      <Trash2 color={colors.primary} size={moderateScale(18)} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.modalButton, styles.modalPrimaryButton, styles.modalFullWidthButton]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={[styles.modalButtonText, styles.modalPrimaryText]}>close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.15,
  },
  overlayContainer: {
    flex: 1,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
  },
  headerButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: moderateScale(18),
    fontFamily: 'Roboto',
    fontWeight: '700',
    color: colors.primary,
  },
  headerSpacer: {
    width: moderateScale(36),
  },
  keyboardAvoider: {
    flex: 1,
  },
  scrollContent: {
    padding: moderateScale(16),
    paddingBottom: moderateScale(32),
  },
  fieldGroup: {
    marginBottom: moderateScale(16),
  },
  label: {
    fontSize: moderateScale(14),
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: colors.primary,
    marginBottom: moderateScale(8),
  },
  input: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F0D7D5',
    backgroundColor: colors.white,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    fontSize: moderateScale(14),
    fontFamily: 'Roboto',
    color: colors.navy,
  },
  multilineInput: {
    minHeight: moderateScale(120),
  },
  inputError: {
    borderColor: colors.primary,
  },
  errorText: {
    color: colors.primary,
    fontSize: moderateScale(12),
    fontFamily: 'Roboto',
    marginTop: moderateScale(6),
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: '#F7DCDC',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  sectionLabel: {
    fontSize: moderateScale(14),
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: colors.primary,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionActionSpacing: {
    marginLeft: moderateScale(16),
  },
  sectionActionText: {
    marginLeft: moderateScale(6),
    fontSize: moderateScale(12),
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -moderateScale(4),
  },
  chip: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(4),
    marginBottom: moderateScale(8),
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: moderateScale(12),
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: colors.primary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  emptyText: {
    fontSize: moderateScale(12),
    fontFamily: 'Roboto',
    color: colors.textSecondary,
  },
  uploadArea: {
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    padding: moderateScale(16),
    backgroundColor: '#FFF5F5',
  },
  uploadInput: {
    fontSize: moderateScale(14),
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: colors.primary,
  },
  submitError: {
    fontSize: moderateScale(12),
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: moderateScale(16),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -moderateScale(6),
    marginBottom: moderateScale(32),
  },
  ctaButton: {
    flex: 1,
    borderRadius: moderateScale(24),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: moderateScale(6),
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.7,
  },
  ctaText: {
    fontSize: moderateScale(14),
    fontFamily: 'Roboto',
    fontWeight: '600',
  },
  cancelText: {
    color: colors.primary,
  },
  saveText: {
    color: colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(24),
  },
  modalCard: {
    width: '100%',
    borderRadius: moderateScale(20),
    backgroundColor: colors.white,
    padding: moderateScale(20),
  },
  modalCardLarge: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: moderateScale(20),
    backgroundColor: colors.white,
    padding: moderateScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  modalTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  modalInput: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#F0D7D5',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    fontSize: moderateScale(14),
    fontFamily: 'Roboto',
    color: colors.navy,
    backgroundColor: colors.white,
    marginBottom: moderateScale(12),
  },
  modalError: {
    color: colors.primary,
    fontSize: moderateScale(12),
    fontFamily: 'Roboto',
    marginBottom: moderateScale(12),
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -moderateScale(6),
  },
  modalButton: {
    flex: 1,
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: moderateScale(6),
  },
  modalGhostButton: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modalGhostText: {
    color: colors.primary,
  },
  modalPrimaryButton: {
    backgroundColor: colors.primary,
  },
  modalPrimaryText: {
    color: colors.white,
  },
  modalButtonText: {
    fontSize: moderateScale(12),
    fontFamily: 'Roboto',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modalList: {
    maxHeight: moderateScale(180),
    marginBottom: moderateScale(16),
  },
  modalListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0D7D5',
  },
  modalListText: {
    fontSize: moderateScale(14),
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: colors.navy,
  },
  modalInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  modalInlineInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: moderateScale(12),
  },
  inlineAddButton: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineAddButtonText: {
    fontSize: moderateScale(12),
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: colors.white,
    textTransform: 'uppercase',
  },
  noteText: {
    fontSize: moderateScale(11),
    fontFamily: 'Roboto',
    color: colors.textSecondary,
    marginTop: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  extraPriceText: {
    fontSize: moderateScale(12),
    fontFamily: 'Roboto',
    color: colors.textSecondary,
  },
  modalFieldGroup: {
    marginBottom: moderateScale(8),
  },
  modalFieldLabel: {
    fontSize: moderateScale(12),
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: colors.primary,
    marginBottom: moderateScale(6),
  },
  modalHalfField: {
    flex: 1,
  },
  modalFullWidthButton: {
    marginTop: moderateScale(8),
  },
  modalListActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalListActionSpacing: {
    marginLeft: moderateScale(12),
  },
  hitSlop: {
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  },
  addonContent: {
    paddingBottom: moderateScale(16),
  },
});

export default AddDishScreen;
