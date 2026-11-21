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
import { BrandLogo } from "../../components/common/BrandLogo";
import { CustomInput as Input } from "../../components/common/Input";
import { useAuthStore } from "../../store/auth.store";
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
  totalRooms: z.number().int().min(1).max(50),
});

const managerRegisterSchema = z.object({
  fullName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(8),
  confirmPassword: z.string(),
  pgInvitationCode: z.string().regex(/^[A-Z2-9]{6}$/),
});

const studentRegisterSchema = z.object({
  fullName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(8),
  pgInvitationCode: z.string().regex(/^[A-Z2-9]{6}$/),
  collegeName: z.string().min(2).max(100),
});

export const RegisterScreen = ({ route }: any) => {
  const { registerLandlord, registerManager, registerStudent } =
    useAuthStore.getState();
  const navigation = useNavigation();
  const { role: accountRole } = useAuthStore.getState();
  const role = accountRole ?? "STUDENT";

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
    formState: { errors, isSubmitting },
  } = useForm<
    formSchema extends z.ZodObject<any, any, any> ? z.infer<formSchema> : any
  >({
    resolver: zodResolver(formSchema),
  });
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const onSubmit = async (data: any) => {
    setSubmitError(null);
    const registrationData = { ...data, name: data.fullName };
    delete registrationData.fullName;

    try {
      if (role === "LANDLORD") {
        await registerLandlord(registrationData);
        navigation.navigate("Dashboard");
      } else if (role === "MANAGER") {
        await registerManager(registrationData);
        navigation.navigate("Dashboard");
      } else {
        await registerStudent(registrationData);
        // Student will be pending approval, navigate to welcome
        navigation.navigate("Welcome");
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
      <Text style={styles.title}>
        {role === "LANDLORD"
          ? "Landlord Registration"
          : role === "MANAGER"
            ? "Manager Registration"
            : "Student Registration"}
      </Text>
      <Text style={styles.subtitle}>
        {role === "LANDLORD"
          ? "Create your PG account"
          : role === "MANAGER"
            ? "Join as manager"
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
          helperText={errors.fullName?.message}
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
          helperText={errors.email?.message}
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
          helperText={errors.phone?.message}
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
          helperText={errors.password?.message}
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
            helperText={errors.confirmPassword?.message}
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
            helperText={errors.pgName?.message}
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
            helperText={errors.pgAddress?.message}
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
            helperText={errors.city?.message}
          />
        </View>
      )}

      {role === "LANDLORD" && (
        <View style={styles.inputGroup}>
          <Input
            label="Total Rooms"
            placeholder="Enter total rooms"
            type="number"
            control={control}
            name="totalRooms"
            rules={{ required: true }}
            error={!!errors.totalRooms}
            helperText={errors.totalRooms?.message}
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
            helperText={errors.pgInvitationCode?.message}
          />
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
            helperText={errors.collegeName?.message}
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
