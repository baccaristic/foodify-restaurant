import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { moderateScale } from 'react-native-size-matters';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { restaurantApi } from '../api/restaurantApi';
import type { RootStackParamList } from '../navigation';
import type { OptionGroupRequestDTO } from '../types/api';

const backgroundImage = require('../../assets/background.png');

const createUniqueId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

type FieldName = 'name' | 'description' | 'price' | 'category' | 'promotionLabel' | 'promotionPrice';

const initialValues: Record<FieldName, string> = {
  name: '',
  description: '',
  price: '',
  category: '',
  promotionLabel: '',
  promotionPrice: '',
};

type ImageField = { id: string; value: string };

type ExtraForm = { id: string; name: string; price: string; isDefault: boolean };

type OptionGroupForm = {
  id: string;
  name: string;
  minSelect: string;
  maxSelect: string;
  required: boolean;
  extras: ExtraForm[];
};

export const AddDishScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [values, setValues] = useState(initialValues);
  const [popular, setPopular] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promotionActive, setPromotionActive] = useState(false);
  const [imageUrls, setImageUrls] = useState<ImageField[]>([{ id: createUniqueId(), value: '' }]);
  const [optionGroups, setOptionGroups] = useState<OptionGroupForm[]>([]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleChange = useCallback((field: FieldName, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
    setSubmitError(null);
  }, []);

  const createEmptyExtra = useCallback((): ExtraForm => ({
    id: createUniqueId(),
    name: '',
    price: '',
    isDefault: false,
  }), []);

  const createEmptyOptionGroup = useCallback((): OptionGroupForm => ({
    id: createUniqueId(),
    name: '',
    minSelect: '0',
    maxSelect: '1',
    required: false,
    extras: [createEmptyExtra()],
  }), [createEmptyExtra]);

  const handlePromotionToggle = useCallback(
    (value: boolean) => {
      setPromotionActive(value);
      setSubmitError(null);
      if (!value) {
        setValues((previous) => ({
          ...previous,
          promotionLabel: '',
          promotionPrice: '',
        }));
        setFieldErrors((previous) => ({
          ...previous,
          promotionLabel: undefined,
          promotionPrice: undefined,
        }));
      }
    },
    []
  );

  const handleImageChange = useCallback((id: string, newValue: string) => {
    setImageUrls((previous) =>
      previous.map((image) => (image.id === id ? { ...image, value: newValue } : image))
    );
    setSubmitError(null);
  }, []);

  const handleAddImageField = useCallback(() => {
    setImageUrls((previous) => [...previous, { id: createUniqueId(), value: '' }]);
    setSubmitError(null);
  }, []);

  const handleRemoveImageField = useCallback((id: string) => {
    setImageUrls((previous) => {
      if (previous.length === 1) {
        return [{ id: createUniqueId(), value: '' }];
      }

      return previous.filter((image) => image.id !== id);
    });
    setSubmitError(null);
  }, []);

  const handleAddOptionGroup = useCallback(() => {
    setOptionGroups((previous) => [...previous, createEmptyOptionGroup()]);
    setSubmitError(null);
  }, [createEmptyOptionGroup]);

  const handleRemoveOptionGroup = useCallback((id: string) => {
    setOptionGroups((previous) => previous.filter((group) => group.id !== id));
    setSubmitError(null);
  }, []);

  const handleOptionGroupFieldChange = useCallback(
    (id: string, field: 'name' | 'minSelect' | 'maxSelect', value: string) => {
      setOptionGroups((previous) =>
        previous.map((group) => (group.id === id ? { ...group, [field]: value } : group))
      );
      setSubmitError(null);
    },
    []
  );

  const handleOptionGroupRequiredToggle = useCallback((id: string, required: boolean) => {
    setOptionGroups((previous) =>
      previous.map((group) => (group.id === id ? { ...group, required } : group))
    );
    setSubmitError(null);
  }, []);

  const handleAddExtra = useCallback(
    (groupId: string) => {
      setOptionGroups((previous) =>
        previous.map((group) =>
          group.id === groupId
            ? { ...group, extras: [...group.extras, createEmptyExtra()] }
            : group
        )
      );
      setSubmitError(null);
    },
    [createEmptyExtra]
  );

  const handleExtraFieldChange = useCallback(
    (groupId: string, extraId: string, field: 'name' | 'price', value: string) => {
      setOptionGroups((previous) =>
        previous.map((group) => {
          if (group.id !== groupId) {
            return group;
          }

          return {
            ...group,
            extras: group.extras.map((extra) =>
              extra.id === extraId ? { ...extra, [field]: value } : extra
            ),
          };
        })
      );
      setSubmitError(null);
    },
    []
  );

  const handleExtraDefaultToggle = useCallback((groupId: string, extraId: string, value: boolean) => {
    setOptionGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        return {
          ...group,
          extras: group.extras.map((extra) =>
            extra.id === extraId ? { ...extra, isDefault: value } : extra
          ),
        };
      })
    );
    setSubmitError(null);
  }, []);

  const handleRemoveExtra = useCallback((groupId: string, extraId: string) => {
    setOptionGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        if (group.extras.length === 1) {
          return {
            ...group,
            extras: [createEmptyExtra()],
          };
        }

        return {
          ...group,
          extras: group.extras.filter((extra) => extra.id !== extraId),
        };
      })
    );
    setSubmitError(null);
  }, [createEmptyExtra]);

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) {
      return true;
    }

    if (
      !values.name.trim() ||
      !values.description.trim() ||
      !values.category.trim() ||
      values.price.trim().length === 0
    ) {
      return true;
    }

    if (promotionActive) {
      if (!values.promotionLabel.trim() || values.promotionPrice.trim().length === 0) {
        return true;
      }
    }

    return false;
  }, [
    isSubmitting,
    promotionActive,
    values.category,
    values.description,
    values.name,
    values.price,
    values.promotionLabel,
    values.promotionPrice,
  ]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    const errors: Partial<Record<FieldName, string>> = {};

    const trimmedName = values.name.trim();
    const trimmedDescription = values.description.trim();
    const trimmedCategory = values.category.trim();
    const normalizedPrice = values.price.replace(',', '.');
    const parsedPrice = Number.parseFloat(normalizedPrice);

    if (!trimmedName) {
      errors.name = 'Please enter a dish name.';
    }

    if (!trimmedDescription) {
      errors.description = 'Please describe the dish.';
    }

    if (!trimmedCategory) {
      errors.category = 'Please provide a category.';
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      errors.price = 'Add a valid price above 0.';
    }

    let trimmedPromotionLabel: string | null = null;
    let parsedPromotionPrice: number | null = null;

    if (promotionActive) {
      trimmedPromotionLabel = values.promotionLabel.trim();
      const normalizedPromotionPrice = values.promotionPrice.replace(',', '.');
      parsedPromotionPrice = Number.parseFloat(normalizedPromotionPrice);

      if (!trimmedPromotionLabel) {
        errors.promotionLabel = 'Add a short label for the promotion.';
      }

      if (!Number.isFinite(parsedPromotionPrice) || parsedPromotionPrice <= 0) {
        errors.promotionPrice = 'Enter a valid promotional price.';
      } else if (Number.isFinite(parsedPrice) && parsedPromotionPrice >= parsedPrice) {
        errors.promotionPrice = 'Promotional price must be lower than the dish price.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Please fix the highlighted fields.');
      return;
    }

    const sanitizedImageUrls = imageUrls
      .map((item) => item.value.trim())
      .filter((value) => value.length > 0);

    let parsedOptionGroups: OptionGroupRequestDTO[] | undefined;

    if (optionGroups.length > 0) {
      const mappedGroups: OptionGroupRequestDTO[] = [];

      for (const group of optionGroups) {
        const trimmedGroupName = group.name.trim();
        const hasGroupContent =
          trimmedGroupName.length > 0 ||
          group.extras.some((extra) => extra.name.trim().length > 0 || extra.price.trim().length > 0);

        if (!hasGroupContent) {
          continue;
        }

        const parsedMinSelect = Number.parseInt(group.minSelect, 10);
        const parsedMaxSelect = Number.parseInt(group.maxSelect, 10);

        if (!trimmedGroupName) {
          setSubmitError('Please enter a name for each customization group.');
          return;
        }

        if (
          !Number.isFinite(parsedMinSelect) ||
          !Number.isFinite(parsedMaxSelect) ||
          parsedMinSelect < 0 ||
          parsedMaxSelect < 0
        ) {
          setSubmitError('Customization limits must be zero or greater.');
          return;
        }

        if (parsedMinSelect > parsedMaxSelect) {
          setSubmitError('Minimum selections cannot exceed the maximum.');
          return;
        }

        const parsedExtras: OptionGroupRequestDTO['extras'] = [];

        for (const extra of group.extras) {
          const trimmedExtraName = extra.name.trim();
          const normalizedExtraPrice = extra.price.replace(',', '.');
          const parsedExtraPrice = Number.parseFloat(normalizedExtraPrice);
          const hasExtraContent = trimmedExtraName.length > 0 || extra.price.trim().length > 0;

          if (!hasExtraContent) {
            continue;
          }

          if (!trimmedExtraName) {
            setSubmitError('Please provide a name for every option in a group.');
            return;
          }

          if (!Number.isFinite(parsedExtraPrice) || parsedExtraPrice < 0) {
            setSubmitError('Option prices must be zero or greater.');
            return;
          }

          parsedExtras.push({
            name: trimmedExtraName,
            price: parsedExtraPrice,
            isDefault: extra.isDefault,
          });
        }

        if (parsedExtras.length === 0) {
          setSubmitError('Add at least one option to every customization group.');
          return;
        }

        mappedGroups.push({
          name: trimmedGroupName,
          minSelect: parsedMinSelect,
          maxSelect: parsedMaxSelect,
          required: group.required,
          extras: parsedExtras,
        });
      }

      if (mappedGroups.length > 0) {
        parsedOptionGroups = mappedGroups;
      }
    }

    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await restaurantApi.addMenuItem(
        {
          name: trimmedName,
          description: trimmedDescription,
          price: parsedPrice,
          category: trimmedCategory,
          popular,
          promotionActive,
          promotionLabel: promotionActive ? trimmedPromotionLabel : null,
          promotionPrice: promotionActive ? parsedPromotionPrice : null,
          imageUrls: sanitizedImageUrls.length > 0 ? sanitizedImageUrls : undefined,
          optionGroups: parsedOptionGroups,
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
    handleGoBack,
    imageUrls,
    isSubmitting,
    optionGroups,
    popular,
    promotionActive,
    values.category,
    values.description,
    values.name,
    values.price,
    values.promotionLabel,
    values.promotionPrice,
  ]);

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
            <Text style={styles.headerTitle}>Add a Dish</Text>
            <View style={styles.headerSpacer} />
          </View>

          <KeyboardAvoidingView
            style={styles.formWrapper}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Dish name</Text>
                <TextInput
                  value={values.name}
                  onChangeText={(text) => handleChange('name', text)}
                  placeholder="Ex. Dragon Roll"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, fieldErrors.name && styles.inputError]}
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!isSubmitting}
                />
                {fieldErrors.name ? <Text style={styles.fieldErrorText}>{fieldErrors.name}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  value={values.description}
                  onChangeText={(text) => handleChange('description', text)}
                  placeholder="What makes this dish special?"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, styles.multilineInput, fieldErrors.description && styles.inputError]}
                  multiline
                  textAlignVertical="top"
                  numberOfLines={4}
                  editable={!isSubmitting}
                />
                {fieldErrors.description ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.description}</Text>
                ) : null}
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.rowField}>
                  <Text style={styles.label}>Price (DT)</Text>
                  <TextInput
                    value={values.price}
                    onChangeText={(text) => handleChange('price', text)}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, fieldErrors.price && styles.inputError]}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    editable={!isSubmitting}
                  />
                  {fieldErrors.price ? <Text style={styles.fieldErrorText}>{fieldErrors.price}</Text> : null}
                </View>

                <View style={styles.rowField}>
                  <Text style={styles.label}>Category</Text>
                  <TextInput
                    value={values.category}
                    onChangeText={(text) => handleChange('category', text)}
                    placeholder="Ex. Sushi"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, fieldErrors.category && styles.inputError]}
                    autoCapitalize="words"
                    returnKeyType="done"
                    editable={!isSubmitting}
                  />
                  {fieldErrors.category ? (
                    <Text style={styles.fieldErrorText}>{fieldErrors.category}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchTitle}>Mark as popular</Text>
                  <Text style={styles.switchSubtitle}>Highlight this dish at the top of your menu.</Text>
                </View>
                <Switch
                  value={popular}
                  onValueChange={setPopular}
                  thumbColor={popular ? colors.white : '#E2E6EA'}
                  trackColor={{ false: '#D7DDE5', true: colors.primary }}
                  disabled={isSubmitting}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchTitle}>Run a promotion</Text>
                  <Text style={styles.switchSubtitle}>
                    Display a promotional badge and discounted price for this dish.
                  </Text>
                </View>
                <Switch
                  value={promotionActive}
                  onValueChange={handlePromotionToggle}
                  thumbColor={promotionActive ? colors.white : '#E2E6EA'}
                  trackColor={{ false: '#D7DDE5', true: colors.primary }}
                  disabled={isSubmitting}
                />
              </View>

              {promotionActive ? (
                <View style={styles.promotionFields}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Promotion label</Text>
                    <TextInput
                      value={values.promotionLabel}
                      onChangeText={(text) => handleChange('promotionLabel', text)}
                      placeholder="Ex. Limited time"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, fieldErrors.promotionLabel && styles.inputError]}
                      editable={!isSubmitting}
                    />
                    {fieldErrors.promotionLabel ? (
                      <Text style={styles.fieldErrorText}>{fieldErrors.promotionLabel}</Text>
                    ) : null}
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Promotion price (DT)</Text>
                    <TextInput
                      value={values.promotionPrice}
                      onChangeText={(text) => handleChange('promotionPrice', text)}
                      placeholder="0.00"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, fieldErrors.promotionPrice && styles.inputError]}
                      keyboardType="decimal-pad"
                      editable={!isSubmitting}
                    />
                    {fieldErrors.promotionPrice ? (
                      <Text style={styles.fieldErrorText}>{fieldErrors.promotionPrice}</Text>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Dish photos</Text>
                <Text style={styles.sectionSubtitle}>
                  Paste hosted image links so guests can see what they are ordering.
                </Text>

                {imageUrls.map((imageField, index) => (
                  <View key={imageField.id} style={styles.inlineField}>
                    <TextInput
                      value={imageField.value}
                      onChangeText={(text) => handleImageChange(imageField.id, text)}
                      placeholder={`Image URL ${index + 1}`}
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.input, styles.inlineInput]}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isSubmitting}
                    />
                    {imageUrls.length > 1 ? (
                      <TouchableOpacity
                        onPress={() => handleRemoveImageField(imageField.id)}
                        style={styles.iconButton}
                        activeOpacity={0.85}
                        disabled={isSubmitting}
                      >
                        <Trash2 color={colors.navy} size={moderateScale(18)} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}

                <TouchableOpacity
                  onPress={handleAddImageField}
                  style={styles.inlineAction}
                  activeOpacity={0.85}
                  disabled={isSubmitting}
                >
                  <Plus color={colors.primary} size={moderateScale(18)} />
                  <Text style={styles.inlineActionText}>Add another photo</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Customization groups</Text>
                  <TouchableOpacity
                    onPress={handleAddOptionGroup}
                    style={styles.inlineAction}
                    activeOpacity={0.85}
                    disabled={isSubmitting}
                  >
                    <Plus color={colors.primary} size={moderateScale(18)} />
                    <Text style={styles.inlineActionText}>Add group</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Offer add-ons, sides, or choices. Each group can require guests to pick items.
                </Text>

                {optionGroups.length === 0 ? (
                  <Text style={styles.emptyHelperText}>
                    You haven&apos;t added any customization groups yet.
                  </Text>
                ) : (
                  optionGroups.map((group, groupIndex) => (
                    <View key={group.id} style={styles.optionGroupCard}>
                      <View style={styles.optionGroupHeader}>
                        <Text style={styles.optionGroupTitle}>{`Group ${groupIndex + 1}`}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveOptionGroup(group.id)}
                          style={styles.iconButton}
                          activeOpacity={0.85}
                          disabled={isSubmitting}
                        >
                          <Trash2 color={colors.navy} size={moderateScale(18)} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Group name</Text>
                        <TextInput
                          value={group.name}
                          onChangeText={(text) =>
                            handleOptionGroupFieldChange(group.id, 'name', text)
                          }
                          placeholder="Ex. Choose your base"
                          placeholderTextColor={colors.textSecondary}
                          style={styles.input}
                          editable={!isSubmitting}
                        />
                      </View>

                      <View style={styles.fieldRow}>
                        <View style={styles.rowField}>
                          <Text style={styles.label}>Min selections</Text>
                          <TextInput
                            value={group.minSelect}
                            onChangeText={(text) =>
                              handleOptionGroupFieldChange(group.id, 'minSelect', text)
                            }
                            placeholder="0"
                            placeholderTextColor={colors.textSecondary}
                            style={styles.input}
                            keyboardType="number-pad"
                            editable={!isSubmitting}
                          />
                        </View>

                        <View style={styles.rowField}>
                          <Text style={styles.label}>Max selections</Text>
                          <TextInput
                            value={group.maxSelect}
                            onChangeText={(text) =>
                              handleOptionGroupFieldChange(group.id, 'maxSelect', text)
                            }
                            placeholder="1"
                            placeholderTextColor={colors.textSecondary}
                            style={styles.input}
                            keyboardType="number-pad"
                            editable={!isSubmitting}
                          />
                        </View>
                      </View>

                      <View style={styles.switchRowSmall}>
                        <Text style={styles.switchTitle}>Selection required</Text>
                        <Switch
                          value={group.required}
                          onValueChange={(value) =>
                            handleOptionGroupRequiredToggle(group.id, value)
                          }
                          thumbColor={group.required ? colors.white : '#E2E6EA'}
                          trackColor={{ false: '#D7DDE5', true: colors.primary }}
                          disabled={isSubmitting}
                        />
                      </View>

                      <View style={styles.extrasContainer}>
                        {group.extras.map((extra, extraIndex) => (
                          <View key={extra.id} style={styles.extraRow}>
                            <View style={styles.extraFields}>
                              <Text style={styles.extraTitle}>{`Option ${extraIndex + 1}`}</Text>
                              <TextInput
                                value={extra.name}
                                onChangeText={(text) =>
                                  handleExtraFieldChange(group.id, extra.id, 'name', text)
                                }
                                placeholder="Ex. Brown rice"
                                placeholderTextColor={colors.textSecondary}
                                style={[styles.input, styles.extraInput]}
                                editable={!isSubmitting}
                              />
                              <TextInput
                                value={extra.price}
                                onChangeText={(text) =>
                                  handleExtraFieldChange(group.id, extra.id, 'price', text)
                                }
                                placeholder="0.00"
                                placeholderTextColor={colors.textSecondary}
                                style={[styles.input, styles.extraInput]}
                                keyboardType="decimal-pad"
                                editable={!isSubmitting}
                              />
                            </View>

                            <View style={styles.extraActions}>
                              <View style={styles.switchRowSmall}>
                                <Text style={styles.switchSubtitle}>Default selection</Text>
                                <Switch
                                  value={extra.isDefault}
                                  onValueChange={(value) =>
                                    handleExtraDefaultToggle(group.id, extra.id, value)
                                  }
                                  thumbColor={extra.isDefault ? colors.white : '#E2E6EA'}
                                  trackColor={{ false: '#D7DDE5', true: colors.primary }}
                                  disabled={isSubmitting}
                                />
                              </View>
                              {group.extras.length > 1 ? (
                                <TouchableOpacity
                                  onPress={() => handleRemoveExtra(group.id, extra.id)}
                                  style={[styles.iconButton, styles.extraRemoveButton]}
                                  activeOpacity={0.85}
                                  disabled={isSubmitting}
                                >
                                  <Trash2 color={colors.navy} size={moderateScale(18)} />
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity
                        onPress={() => handleAddExtra(group.id)}
                        style={[styles.inlineAction, styles.addExtraButton]}
                        activeOpacity={0.85}
                        disabled={isSubmitting}
                      >
                        <Plus color={colors.primary} size={moderateScale(18)} />
                        <Text style={styles.inlineActionText}>Add option</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              {submitError ? <Text style={styles.submitErrorText}>{submitError}</Text> : null}

              <TouchableOpacity
                style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.9}
                disabled={isSubmitDisabled}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Add dish</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
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
    marginBottom: moderateScale(16),
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
  formWrapper: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: moderateScale(24),
  },
  fieldGroup: {
    marginBottom: moderateScale(18),
  },
  fieldRow: {
    flexDirection: 'row',
    gap: moderateScale(16),
    marginBottom: moderateScale(18),
  },
  rowField: {
    flex: 1,
  },
  label: {
    ...typography.bodySmall,
    color: colors.navy,
    marginBottom: moderateScale(8),
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(38, 75, 202, 0.18)',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    ...typography.bodyMedium,
    color: colors.navy,
  },
  multilineInput: {
    minHeight: moderateScale(120),
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  fieldErrorText: {
    marginTop: moderateScale(6),
    ...typography.bodySmall,
    color: '#FF6B6B',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    borderWidth: 1,
    borderColor: 'rgba(38, 75, 202, 0.18)',
    marginBottom: moderateScale(24),
  },
  switchCopy: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  switchTitle: {
    ...typography.bodyStrong,
    color: colors.navy,
  },
  switchSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: moderateScale(4),
  },
  promotionFields: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(18),
    borderWidth: 1,
    borderColor: 'rgba(38, 75, 202, 0.18)',
    marginBottom: moderateScale(24),
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(18),
    borderWidth: 1,
    borderColor: 'rgba(38, 75, 202, 0.18)',
    marginBottom: moderateScale(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
    gap: moderateScale(12),
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.navy,
  },
  sectionSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: moderateScale(16),
  },
  emptyHelperText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  inlineField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  inlineInput: {
    flex: 1,
  },
  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(23, 33, 58, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  inlineActionText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  optionGroupCard: {
    borderWidth: 1,
    borderColor: 'rgba(23, 33, 58, 0.08)',
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    marginBottom: moderateScale(18),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  optionGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  optionGroupTitle: {
    ...typography.bodyStrong,
    color: colors.navy,
  },
  switchRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: moderateScale(12),
    marginBottom: moderateScale(12),
  },
  extrasContainer: {
    gap: moderateScale(16),
    marginBottom: moderateScale(12),
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(12),
  },
  extraFields: {
    flex: 1,
    gap: moderateScale(8),
  },
  extraTitle: {
    ...typography.bodyStrong,
    color: colors.navy,
  },
  extraInput: {
    width: '100%',
  },
  extraActions: {
    alignItems: 'flex-end',
    gap: moderateScale(12),
  },
  extraRemoveButton: {
    alignSelf: 'flex-end',
  },
  addExtraButton: {
    marginTop: moderateScale(8),
  },
  submitErrorText: {
    ...typography.bodySmall,
    color: '#FF6B6B',
    marginBottom: moderateScale(16),
    textAlign: 'center',
  },
  submitButton: {
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(38, 75, 202, 0.35)',
  },
  submitButtonText: {
    ...typography.button,
  },
});

