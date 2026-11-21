import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { CustomInput as Input } from "../../components/common/Input";
import { useAuthStore } from "../../store/auth.store";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { COLORS } from "../../theme";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or mobile number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuthStore.getState();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setSubmitError(null);
    try {
      await login(data.identifier, data.password);
      navigation.navigate("Dashboard");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Login failed."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        testID="login-scroll-view"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        <Button
          mode="text"
          contentStyle={styles.backButtonContent}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹  Back</Text>
        </Button>

        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>N</Text>
        </View>
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.title}>Sign in to your account</Text>
        <Text style={styles.subtitle}>
          Use the email address or mobile number registered with Nivasa.
        </Text>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Input
              label="Email or Mobile Number"
              placeholder="Enter email or mobile number"
              type="email"
              control={control}
              name="identifier"
              rules={[{ required: true }]}
              error={!!errors.identifier}
              helperText={errors.identifier?.message}
            />
          </View>

          <View style={styles.inputGroup}>
            <Input
              label="Password"
              placeholder="Enter your password"
              type="password"
              control={control}
              name="password"
              rules={[{ required: true }]}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          </View>

          <View style={styles.forgotPassword}>
            <Text
              style={styles.forgotText}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              Forgot Password?
            </Text>
          </View>

          <Button
            mode="contained"
            disabled={isSubmitting}
            contentStyle={styles.submitButton}
            onPress={() => void handleSubmit(onSubmit)()}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>

          {submitError && (
            <Text accessibilityRole="alert" style={styles.error}>
              {submitError}
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButtonContent: {
    alignSelf: "flex-start",
    paddingHorizontal: 0,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginTop: 20,
    marginBottom: 24,
  },
  brandMarkText: {
    color: COLORS.surface,
    fontSize: 26,
    fontWeight: "800",
  },
  eyebrow: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
    marginBottom: 24,
  },
  formCard: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  inputGroup: {
    marginBottom: 12,
  },
  forgotPassword: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  submitButton: {
    minHeight: 48,
  },
  error: {
    color: COLORS.danger,
    marginTop: 12,
  },
});
