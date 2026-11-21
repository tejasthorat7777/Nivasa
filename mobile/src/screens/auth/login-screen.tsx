import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { BrandLogo } from "../../components/common/BrandLogo";
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

const portalRoles = [
  {
    value: "STUDENT",
    label: "Student / Resident",
    access: "Access: Room rent, maintenance complaints & food menu",
  },
  {
    value: "MANAGER",
    label: "Manager",
    access: "Access: Resident check-ins, gate passes & complaints",
  },
  {
    value: "LANDLORD",
    label: "Landlord",
    access: "Access: PG occupancy, revenue tracking & property analytics",
  },
] as const;

export const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuthStore.getState();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [selectedPortal, setSelectedPortal] =
    React.useState<(typeof portalRoles)[number]["value"]>("STUDENT");
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const selectedPortalAccess =
    portalRoles.find((portal) => portal.value === selectedPortal)?.access;

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
        <View style={styles.brandHeader}>
          <BrandLogo width={184} height={72} />
        </View>

        <View style={styles.welcomeMessage}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Select your portal role to access PG rent, rooms, and daily operations.
          </Text>
        </View>

        <View style={styles.portalSection}>
          <View style={styles.portalSelector}>
            {portalRoles.map((portal) => (
              <Pressable
                key={portal.value}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedPortal === portal.value }}
                testID={`login-role-${portal.value.toLowerCase()}`}
                style={[
                  styles.portalOption,
                  selectedPortal === portal.value && styles.portalOptionActive,
                ]}
                onPress={() => setSelectedPortal(portal.value)}
              >
                <Text
                  style={[
                    styles.portalOptionText,
                    selectedPortal === portal.value && styles.portalOptionTextActive,
                  ]}
                >
                  {portal.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.portalHelper}>
            <View style={styles.portalDot} />
            <Text style={styles.portalHint}>{selectedPortalAccess}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Phone Number or Email</Text>
            <Input
              type="email"
              control={control}
              name="identifier"
              rules={[{ required: true }]}
              error={!!errors.identifier}
              helperText={errors.identifier?.message}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.fieldHeading}>
              <Text style={styles.fieldLabel}>Password</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                disabled
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>
            <Input
              type="password"
              secureTextEntry={!passwordVisible}
              right={
                <TextInput.Icon
                  icon={({ color, size }) => (
                    <Text style={{ color, fontSize: size }}>
                      {passwordVisible ? "◉" : "◎"}
                    </Text>
                  )}
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  accessibilityLabel={
                    passwordVisible ? "Hide password" : "Show password"
                  }
                />
              }
              control={control}
              name="password"
              rules={[{ required: true }]}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          </View>

          <View style={styles.rememberRow}>
            <View style={styles.checkbox}>
              <Text style={styles.checkboxText}>✓</Text>
            </View>
            <Text style={styles.rememberText}>Keep me logged in for 30 days</Text>
          </View>

          <Button
            mode="contained"
            disabled={isSubmitting}
            style={styles.submitButtonShell}
            contentStyle={styles.submitButton}
            onPress={() => void handleSubmit(onSubmit)()}
          >
            {isSubmitting ? "Signing in..." : "Login to Account   →"}
          </Button>

          {submitError && (
            <Text accessibilityRole="alert" style={styles.error}>
              {submitError}
            </Text>
          )}

          <Button
            mode="outlined"
            disabled
            style={styles.biometricButtonShell}
            contentStyle={styles.biometricButton}
          >
            Use Fingerprint / Face ID
          </Button>
        </View>

        <View style={styles.socialSection}>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
            <View style={styles.divider} />
          </View>
          <View style={styles.socialButtons}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              disabled
              style={styles.socialButton}
            >
              <Text style={styles.socialIcon}>◉</Text>
              <Text style={styles.socialText}>WhatsApp OTP</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              disabled
              style={styles.socialButton}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.socialText}>Google</Text>
            </Pressable>
          </View>
          <Text style={styles.optionalHint}>
            Alternative sign-in methods are not enabled yet.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account yet?</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.createAccount}>Create Account</Text>
          </Pressable>
          <Text style={styles.supportText}>
            Facing issues? Contact Warden / Support
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFBF5",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 0,
  },
  brandHeader: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  welcomeMessage: {
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
  },
  subtitle: {
    maxWidth: 290,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
  },
  portalSection: {
    marginBottom: 18,
  },
  portalSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D6E6DF",
    backgroundColor: "#EBF7F2",
    gap: 4,
  },
  portalOption: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  portalOptionActive: {
    backgroundColor: "#0B4D3C",
    elevation: 2,
  },
  portalOptionText: {
    color: "#0B4D3C",
    opacity: 0.75,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  portalOptionTextActive: {
    color: COLORS.surface,
    opacity: 1,
  },
  portalHelper: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#FBD2BA",
    borderRadius: 9,
    backgroundColor: "#FFF4ED",
  },
  portalDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  portalHint: {
    flex: 1,
    color: "#0B4D3C",
    fontSize: 11,
    fontWeight: "500",
  },
  inputGroup: {
    gap: 5,
  },
  form: {
    gap: 8,
  },
  fieldHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  fieldLabel: {
    color: "#0B4D3C",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  forgotText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "700",
  },
  submitButtonShell: {
    alignSelf: "stretch",
    width: "100%",
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: "#0B4D3C",
    elevation: 5,
  },
  submitButton: {
    minHeight: 52,
    paddingHorizontal: 18,
  },
  biometricButtonShell: {
    alignSelf: "stretch",
    width: "100%",
    marginTop: 8,
    borderRadius: 12,
    borderColor: "#C9DBD4",
    backgroundColor: COLORS.surface,
  },
  biometricButton: {
    minHeight: 44,
  },
  socialSection: {
    marginTop: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  socialButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  socialButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    elevation: 1,
  },
  socialIcon: {
    color: "#10A36A",
    fontSize: 16,
    fontWeight: "700",
  },
  googleIcon: {
    color: "#4285F4",
    fontSize: 16,
    fontWeight: "800",
  },
  socialText: {
    color: "#1F2937",
    fontSize: 12,
    fontWeight: "600",
  },
  optionalHint: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 10,
    textAlign: "center",
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 4,
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  checkboxText: {
    color: COLORS.surface,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  rememberText: {
    color: "#1F2937",
    fontSize: 12,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
    marginTop: 22,
    marginHorizontal: -24,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: "#F0EEE8",
    gap: 8,
  },
  footerText: {
    color: "#1F2937",
    fontSize: 12,
  },
  createAccount: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
    textDecorationColor: COLORS.secondary,
  },
  supportText: {
    color: "#6B7280",
    fontSize: 11,
  },
  error: {
    color: COLORS.danger,
    marginTop: 12,
  },
});
