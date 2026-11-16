import * as React from "react";
import { View, Text, Input, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/auth.store";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const landlordRegisterSchema = z.object({
  fullName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
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
  password: z.string().min(6),
  confirmPassword: z.string(),
  pgInvitationCode: z.string().regex(/^[A-Z2-9]{6}$/),
});

const studentRegisterSchema = z.object({
  fullName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
  confirmPassword: z.string(),
  pgInvitationCode: z.string().regex(/^[A-Z2-9]{6}$/),
  collegeName: z.string().min(2).max(100),
});

export const RegisterScreen = ({ route }: any) => {
  const { registerLandlord, registerManager, registerStudent } = useAuthStore.getState();
  const navigation = useNavigation();
  const { role } = useAuthStore.getState();

  // Determine which registration flow based on role or route
  const [formSchema, onRegister] = role === "LANDLORD"
    ? [landlordRegisterSchema, registerLandlord]
    : role === "MANAGER"
      ? [managerRegisterSchema, registerManager]
      : [studentRegisterSchema, registerStudent];

  const {
    register: formRegister,
    control,
    handleSubmit,
    formState: { errors, isSubmiting },
    reset,
  } = useForm<formSchema extends z.ZodObject<any, any, any> ? z.infer<formSchema> : any>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      if (role === "LANDLORD") {
        await registerLandlord({
          ...data,
        });
        navigation.navigate("Dashboard");
      } else if (role === "MANAGER") {
        await registerManager({
          ...data,
        });
        navigation.navigate("Dashboard");
      } else {
        await registerStudent({
          ...data,
        });
        // Student will be pending approval, navigate to welcome
        navigation.navigate("Welcome");
      }
    } catch (error: any) {
      // Show error
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {role === "LANDLORD" ? "Landlord Registration" : role === "MANAGER" ? "Manager Registration" : "Student Registration"}
      </Text>
      <Text style={styles.subtitle}>
        {role === "LANDLORD" ? "Create your PG account" : role === "MANAGER" ? "Join as manager" : "Join PG as student"}
      </Text>

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

      {role !== "STUDENT" && (
        <View style={styles.inputGroup}>
          <Input
            label="Confirm Password"
            placeholder="Confirm password"
            type="password"
            control={control}
            name="confirmPassword"
            rules={[{ required: true, value: data => data.password === data.confirmPassword }]}
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
            control={control}
            name="totalRooms"
            rules={[{ required: true, value: data => data.totalRooms > 0 }]}
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

      <Button
        mode="contained"
        disabled={isSubmiting}
        onPress={handleSubmit(onSubmit)}
      >
        {isSubmiting ? "Registering..." : "Register"}
      </Button>

      <Text style={styles.loginLink}>
        Already have an account?{" "}

        <Text style={styles.loginLinkText} onPress={() => navigation.navigate("Login")}>
          Login
        </Text>
      </Text>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
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
    color: "#1E40AF",
    fontWeight: "500",
    marginLeft: 4,
  },
};