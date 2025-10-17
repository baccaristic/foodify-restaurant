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
import { ArrowLeft } from 'lucide-react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { restaurantApi } from '../api/restaurantApi';
import type { RootStackParamList } from '../navigation';

const backgroundImage = require('../../assets/background.png');

type FieldName = 'name' | 'description' | 'price' | 'category';

const initialValues: Record<FieldName, string> = {
  name: '',
  description: '',
  price: '',
  category: '',
};

export const AddDishScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [values, setValues] = useState(initialValues);
  const [popular, setPopular] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleChange = useCallback((field: FieldName, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
  }, []);

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting) {
      return true;
    }

    return (
      !values.name.trim() ||
      !values.description.trim() ||
      !values.category.trim() ||
      values.price.trim().length === 0
    );
  }, [isSubmitting, values.category, values.description, values.name, values.price]);

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

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Please fix the highlighted fields.');
      return;
    }

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
          promotionActive: false,
          promotionLabel: null,
          promotionPrice: null,
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
  }, [handleGoBack, isSubmitting, popular, values.category, values.description, values.name, values.price]);

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

