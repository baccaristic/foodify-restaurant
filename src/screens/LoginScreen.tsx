import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuthStore } from '../stores';
import type { LoginRequest } from '../types/api';

const backgroundImage = require('../../assets/background.png');
const logoImage = require('../../assets/appLogo.png');

const initialValues: LoginRequest = {
  email: '',
  password: '',
};

export const LoginScreen: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const [values, setValues] = useState<LoginRequest>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValid = useMemo(
    () => values.email.trim().length > 0 && values.password.trim().length > 0,
    [values.email, values.password]
  );

  const handleChange = (field: keyof LoginRequest, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login({
        email: values.email.trim(),
        password: values.password,
      });
    } catch (error) {
      let message = 'Unable to sign in. Please check your credentials and try again.';

      if (typeof error === 'object' && error && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          message = response.data.message;
        }
      }

      setErrorMessage(message);
      Alert.alert('Login failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Image source={logoImage} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>Welcome back, Restaurant</Text>
              <Text style={styles.subtitle}>
                Orders are coming, let&apos;s fire up the kitchen!
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Enter your e-mail address</Text>
              <TextInput
                value={values.email}
                onChangeText={(text) => handleChange('email', text)}
                placeholder="eg.yourmail@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="username"
                autoCorrect={false}
                returnKeyType="next"
                style={[styles.input, errorMessage && styles.inputError]}
                editable={!isSubmitting}
              />

              <Text style={[styles.label, styles.passwordLabel]}>Enter your password</Text>
              <TextInput
                value={values.password}
                onChangeText={(text) => handleChange('password', text)}
                placeholder="password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                style={[styles.input, errorMessage && styles.inputError]}
                editable={!isSubmitting}
              />

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <TouchableOpacity
                style={[styles.button, (!isValid || isSubmitting) && styles.buttonDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.9}
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.textOnDark} />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
    alignItems: 'stretch',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: 16,
    marginTop: 24,
  },
  logo: {
    width: 128,
    height: 80,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.navy,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    paddingHorizontal: 12,
  },
  form: {
    marginTop: 32,
  },
  label: {
    ...typography.bodySmall,
    fontSize: 14,
    color: colors.navy,
    marginBottom: 8,
  },
  passwordLabel: {
    marginTop: 16,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.primary,
  },
  button: {
    marginTop: 32,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: colors.mutedBlack,
  },
  buttonText: {
    ...typography.inverseTitle,
    fontSize: 18,
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
    ...typography.bodySmall,
    fontSize: 14,
    color: colors.primary,
  },
});
