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
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BrandLogo } from "../../components/common/BrandLogo";
import { CustomInput as Input } from "../../components/common/Input";
import { useAuthStore } from "../../store/auth.store";
import type { AccountRole, RootStackParamList } from "../../navigation.types";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { COLORS } from "../../theme";

const landlordRegisterSchema = z.object({
  fullName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(8),
  confirmPassword: z.string(),
  pgName: z.string().min(2).max(100),
  pgAddress: z.string().min(2).max(200),
  city: z.string().min(2).max(50),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

const managerRegisterSchema = z.object({
  fullName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(8),
  confirmPassword: z.string(),
  pgInvitationCode: z.string().regex(/^[A-Z2-9]{6}$/),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

const studentRegisterSchema = z.object({
  fullName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(8),
  pgInvitationCode: z.string().regex(/^[A-Z2-9]{6}$/),
  collegeName: z.string().min(2).max(100),
});

const accountRoles: { value: AccountRole; label: string }[] = [
  { value: "STUDENT", label: "Student" },
  { value: "MANAGER", label: "Manager" },
  { value: "LANDLORD", label: "Landlord" },
];

export const RegisterScreen = ({
  route,
}: {
  route?: { params?: RootStackParamList["Register"] };
}) => {
  const { registerLandlord, registerManager, registerStudent } =
    useAuthStore.getState();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [role, setRole] = React.useState<AccountRole>(
    route?.params?.role ?? "STUDENT"
  );

  // Determine which registration flow based on role or route
  const formSchema =
    role === "LANDLORD"
      ? landlordRegisterSchema
      : role === "MANAGER"
        ? managerRegisterSchema
        : studentRegisterSchema;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(formSchema),
  });
  const getErrorMessage = (field: string): string | undefined => {
    const message = errors[field]?.message;
    return typeof message === "string" ? message : undefined;
  };
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const selectRole = (nextRole: AccountRole) => {
    if (nextRole === role) return;
    setRole(nextRole);
    reset({});
    setSubmitError(null);
  };

  const onSubmit = async (data: any) => {
    setSubmitError(null);
    const registrationData = { ...data, name: data.fullName };
    delete registrationData.fullName;

    try {
      if (role === "LANDLORD") {
        await registerLandlord(registrationData);
        navigation.reset({
          index: 0,
          routes: [{ name: "BuildingSetup", params: { onboarding: true } }],
        });
      } else if (role === "MANAGER") {
        await registerManager(registrationData);
        navigation.reset({
          index: 0,
          routes: [{ name: "Dashboard" }],
        });
      } else {
        await registerStudent(registrationData);
        navigation.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        });
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Registration failed."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        testID="registration-scroll-view"
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
      <BrandLogo width={164} height={55} style={styles.brandMark} />
      <Text style={styles.eyebrow}>ACCOUNT SETUP</Text>
      <Text style={styles.rolePrompt}>Create an account as</Text>
      <View style={styles.roleSelector}>
        {accountRoles.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: role === option.value }}
            onPress={() => selectRole(option.value)}
            style={[
              styles.roleOption,
              role === option.value && styles.roleOptionSelected,
            ]}
            testID={`register-role-${option.value.toLowerCase()}`}
          >
            <Text
              style={[
                styles.roleOptionText,
                role === option.value && styles.roleOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.title}>
        {role === "LANDLORD"
          ? "Landlord Registration"
          : role === "MANAGER"
            ? "Manager Registration"
            : "Student Registration"}
      </Text>
      <Text style={styles.subtitle}>
        {role === "LANDLORD"
          ? "Create your account and add your PG details"
          : role === "MANAGER"
            ? "Join a PG using the invitation code from its owner"
            : "Join PG as student"}
      </Text>

      <View style={styles.formCard}>
      <View style={styles.inputGroup}>
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          control={control}
          name="fullName"
          rules={[{ required: true }]}
          error={!!errors.fullName}
          helperText={getErrorMessage("fullName")}
        />
      </View>

      <View style={styles.inputGroup}>
        <Input
          label="Email"
          placeholder="Enter your email"
          control={control}
          name="email"
          rules={[{ required: true }]}
          error={!!errors.email}
          helperText={getErrorMessage("email")}
        />
      </View>

      <View style={styles.inputGroup}>
        <Input
          label="Phone"
          placeholder="Enter your phone number"
          control={control}
          name="phone"
          rules={[{ required: true }]}
          error={!!errors.phone}
          helperText={getErrorMessage("phone")}
        />
      </View>

      <View style={styles.inputGroup}>
        <Input
          label="Password"
          placeholder="Enter password"
          type="password"
          control={control}
          name="password"
          rules={[{ required: true }]}
          error={!!errors.password}
          helperText={getErrorMessage("password")}
        />
      </View>

      {(role === "LANDLORD" || role === "MANAGER") && (
        <View style={styles.inputGroup}>
          <Input
            label="Confirm Password"
            placeholder="Confirm password"
            type="password"
            control={control}
            name="confirmPassword"
            rules={{ required: true }}
            error={!!errors.confirmPassword}
            helperText={getErrorMessage("confirmPassword")}
          />
        </View>
      )}

      {role === "LANDLORD" && (
        <View style={styles.inputGroup}>
          <Input
            label="PG Name"
            placeholder="Enter PG name"
            control={control}
            name="pgName"
            rules={[{ required: true }]}
            error={!!errors.pgName}
            helperText={getErrorMessage("pgName")}
          />
        </View>
      )}

      {role === "LANDLORD" && (
        <View style={styles.inputGroup}>
          <Input
            label="PG Address"
            placeholder="Enter PG address"
            control={control}
            name="pgAddress"
            rules={[{ required: true }]}
            error={!!errors.pgAddress}
            helperText={getErrorMessage("pgAddress")}
          />
        </View>
      )}

      {role === "LANDLORD" && (
        <View style={styles.inputGroup}>
          <Input
            label="City"
            placeholder="Enter city"
            control={control}
            name="city"
            rules={[{ required: true }]}
            error={!!errors.city}
            helperText={getErrorMessage("city")}
          />
        </View>
      )}

      {role !== "LANDLORD" && (
        <View style={styles.inputGroup}>
          <Input
            label="PG Invitation Code"
            placeholder="Enter invitation code"
            control={control}
            name="pgInvitationCode"
            rules={[{ required: true }]}
            error={!!errors.pgInvitationCode}
            helperText={getErrorMessage("pgInvitationCode")}
          />
          {role === "MANAGER" && (
            <Text style={styles.invitationHint}>
              Ask your PG owner for the invitation code.
            </Text>
          )}
        </View>
      )}

      {role === "STUDENT" && (
        <View style={styles.inputGroup}>
          <Input
            label="College Name"
            placeholder="Enter college name"
            control={control}
            name="collegeName"
            rules={[{ required: true }]}
            error={!!errors.collegeName}
            helperText={getErrorMessage("collegeName")}
          />
        </View>
      )}

      {submitError && (
        <Text accessibilityRole="alert" style={styles.error}>
          {submitError}
        </Text>
      )}

      <Button
        mode="contained"
        disabled={isSubmitting}
        onPress={() => void handleSubmit(onSubmit)()}
      >
        {isSubmitting ? "Registering..." : "Register"}
      </Button>

      <Text style={styles.loginLink}>
        Already have an account?{" "}
        <Text
          style={styles.loginLinkText}
          onPress={() => navigation.navigate("Login")}
        >
          Login
        </Text>
      </Text>
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
    marginTop: 20,
    marginBottom: 20,
  },
  eyebrow: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  rolePrompt: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  roleSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  roleOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  roleOptionText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  roleOptionTextSelected: {
    color: COLORS.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
    marginBottom: 20,
  },
  formCard: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  inputGroup: {
    marginBottom: 16,
  },
  invitationHint: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  loginLink: {
    marginTop: 24,
    alignItems: "center",
    flexDirection: "row",
  },
  loginLinkText: {
    color: COLORS.primary,
    fontWeight: "500",
    marginLeft: 4,
  },
  error: {
    color: COLORS.danger,
    marginBottom: 12,
  },
});
