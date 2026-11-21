import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WelcomeScreen } from "./screens/auth/welcome-screen";
import { LoginScreen } from "./screens/auth/login-screen";
import { RegisterScreen } from "./screens/auth/register-screen";
import { LandlordDashboard } from "./screens/landlord/landlord-dashboard";
import { ManagerDashboard } from "./screens/manager/manager-dashboard";
import { StudentDashboard } from "./screens/student/student-dashboard";
import { useAuthStore } from "./store/auth.store";
import { COLORS } from "./theme";

const Stack = createNativeStackNavigator();

const DashboardScreen = () => {
  const role = useAuthStore((state) => state.role);

  if (role === "LANDLORD") {
    return <LandlordDashboard />;
  }
  if (role === "MANAGER") {
    return <ManagerDashboard />;
  }
  return <StudentDashboard />;
};

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}