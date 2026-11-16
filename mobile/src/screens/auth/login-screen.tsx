import * as React from "react";
import { View, Text, Input, Button,useErrorBoundary } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/auth.store";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuthStore.getState();

  const {
    register: formRegister,
    control,
    handleSubmit,
    formState: { errors, isSubmiting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login(data.email, data.password);
      navigation.navigate("Dashboard");
    } catch (error: any) {
      // Handle error - will be shown by useEffect or state
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to your StayNest account</Text>

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

      <Button
        mode="contained"
        disabled={isSubmiting}
        onPress={handleSubmit(onSubmit)}
      >
        {isSubmiting ? "Logging in..." : "Login"}
      </Button>

      <View style={styles.forgotPassword}>
        <Text style={styles.forgotText} onPress={() => navigation.navigate("ForgotPassword")}>
          Forgot Password?
        </Text>
      </View>

      <Text style={styles.divider}>or</Text>

      <View style={styles.socialButtons}>
        <Button mode="outlined" style={{ width: "50%" }}>
          <Text>Continue with Google</Text>
        </Button>
        <Button mode="outlined" style={{ width: "50%" }}>
          <Text>Continue with Apple</Text>
        </Button>
      </View>
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
    fontSize: 24,
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
  forgotPassword: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  forgotText: {
    color: "#1E40AF",
    fontSize: 12,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
};