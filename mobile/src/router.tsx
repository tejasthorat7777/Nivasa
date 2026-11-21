import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { WelcomeScreen } from "./screens/auth/welcome-screen";
import { LoginScreen } from "./screens/auth/login-screen";
import { RegisterScreen } from "./screens/auth/register-screen";
import { ProfileSettingsScreen } from "./screens/profile/profile-screen";
import { BuildingSetupScreen } from "./screens/landlord/building-setup-screen";
import { LandlordDashboard } from "./screens/landlord/landlord-dashboard";
import { ManagerDashboard } from "./screens/manager/manager-dashboard";
import { StudentDashboard } from "./screens/student/student-dashboard";
import type { RootStackParamList } from "./navigation.types";
import { useAuthStore } from "./store/auth.store";
import { COLORS } from "./theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

type DashboardScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Dashboard"
>;

const DashboardScreen = ({ navigation }: DashboardScreenProps) => {
  const role = useAuthStore((state) => state.role);
  const onProfilePress = () => navigation.navigate("Profile");
  const onBuildingSetupPress = () => navigation.navigate("BuildingSetup");

  if (role === "LANDLORD") {
    return (
      <LandlordDashboard
        onProfilePress={onProfilePress}
        onBuildingSetupPress={onBuildingSetupPress}
      />
    );
  }
  if (role === "MANAGER") {
    return <ManagerDashboard onProfilePress={onProfilePress} />;
  }
  return <StudentDashboard onProfilePress={onProfilePress} />;
};

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [sessionStatus, setSessionStatus] = React.useState<
    "loading" | "ready" | "error"
  >("loading");
  const [sessionError, setSessionError] = React.useState("");

  const restoreSession = React.useCallback(async () => {
    setSessionStatus("loading");
    setSessionError("");
    try {
      await useAuthStore.getState().checkSession();
      setSessionStatus("ready");
    } catch (error) {
      console.error("Failed to restore saved session:", error);
      setSessionError(
        error instanceof Error
          ? error.message
          : "Unable to restore your saved session."
      );
      setSessionStatus("error");
    }
  }, []);

  React.useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  if (sessionStatus === "loading") {
    return (
      <View style={styles.status}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.statusText}>Restoring your session...</Text>
      </View>
    );
  }

  if (sessionStatus === "error") {
    return (
      <View style={styles.status}>
        <Text style={styles.errorTitle}>We couldn't restore your session</Text>
        <Text style={styles.statusText}>{sessionError}</Text>
        <Button mode="contained" onPress={() => void restoreSession()}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "Dashboard" : "Login"}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Profile" component={ProfileSettingsScreen} />
      <Stack.Screen name="BuildingSetup" component={BuildingSetupScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  status: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: COLORS.background,
  },
  statusText: {
    color: COLORS.muted,
    textAlign: "center",
  },
  errorTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});