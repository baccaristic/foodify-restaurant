import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { moderateScale } from 'react-native-size-matters';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuthStore } from '../store/authStore';

const backgroundImage = require('../../assets/background.png');
const logoImage = require('../../assets/applogo.png');

export const LoginScreen: React.FC = () => {
  const { login, loading, error, clearError } = useAuthStore((state) => ({
    login: state.login,
    loading: state.loading,
    error: state.error,
    clearError: state.clearError,
  }));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | undefined>();

  const handleEmailChange = useCallback(
    (value: string) => {
      if (localError) {
        setLocalError(undefined);
      }
      if (error) {
        clearError();
      }
      setEmail(value);
    },
    [localError, error, clearError]
  );

  const handlePasswordChange = useCallback(
    (value: string) => {
      if (localError) {
        setLocalError(undefined);
      }
      if (error) {
        clearError();
      }
      setPassword(value);
    },
    [localError, error, clearError]
  );

  const validationError = useMemo(() => {
    if (localError) {
      return localError;
    }

    return error;
  }, [localError, error]);

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setLocalError('Please provide both your email address and password.');
      return;
    }

    setLocalError(undefined);
    const success = await login({ email: email.trim(), password: password.trim() });

    if (!success) {
      setPassword('');
    }
  }, [email, password, login]);

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <View pointerEvents="none" style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerSection}>
              <Image source={logoImage} style={styles.logo} contentFit="contain" />
              <Text style={styles.title}>WELCOME BACK, RESTAURANT</Text>
              <Text style={styles.subtitle}>
                Orders are coming, let&apos;s fire up the kitchen!
              </Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Enter your email address</Text>
                <TextInput
                  style={[styles.input, validationError ? styles.inputError : null]}
                  placeholder="Your email eg. yourmail@email.com"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={handleEmailChange}
                  textContentType="emailAddress"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Enter your password</Text>
                <TextInput
                  style={[styles.input, validationError ? styles.inputError : null]}
                  placeholder="password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  value={password}
                  onChangeText={handlePasswordChange}
                  textContentType="password"
                />
              </View>

              {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && !loading ? styles.buttonPressed : null,
                  loading ? styles.buttonDisabled : null,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textOnDark} />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(24),
    paddingBottom: moderateScale(32),
    paddingTop: moderateScale(48),
  },
  headerSection: {
    alignItems: 'center',
  },
  logo: {
    width: moderateScale(160),
    height: moderateScale(160),
    marginBottom: moderateScale(12),
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    color: colors.navy,
    letterSpacing: 1.5,
  },
  subtitle: {
    marginTop: moderateScale(12),
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  formSection: {
    marginTop: moderateScale(36),
  },
  fieldGroup: {
    marginBottom: moderateScale(24),
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: moderateScale(8),
  },
  input: {
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: colors.white,
    paddingHorizontal: moderateScale(16),
    paddingVertical: Platform.select({ ios: moderateScale(14), android: moderateScale(12) }),
    color: colors.textPrimary,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
  inputError: {
    borderColor: colors.primary,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: moderateScale(16),
  },
  button: {
    borderRadius: moderateScale(14),
    backgroundColor: colors.primary,
    paddingVertical: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(8),
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    fontSize: moderateScale(16),
  },
});
