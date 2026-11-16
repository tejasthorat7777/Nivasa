import * as React from "react";
import { View, Text, ActivityIndicator, Image, StyleSheet } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/auth.store";

export const SplashScreen = () => {
  const navigation = useNavigation();
  const { checkSession, isLoading } = useAuthStore.getState();

  React.useEffect(() => {
    // Check for existing authentication session
    checkSession().then(() => {
      // If authenticated, navigate to appropriate dashboard
      const { role, isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated && role) {
        setTimeout(() => {
          navigation.navigate(`(${role.toLowerCase()})`);
        }, 500);
      } else {
        // No session, go to welcome/onboarding
        setTimeout(() => {
          navigation.navigate("Welcome");
        }, 500);
      }
    });
  }, [navigation, checkSession]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/nivasa-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.tagline}>Manage. Stay. Thrive.</Text>
      <ActivityIndicator size="large" animating={isLoading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
    // Navy background with orange windows - per branding spec
    backgroundColor: "#1E40AF",
    borderRadius: 20,
  },
  tagline: {
    fontSize: 16,
    color: "#1F2937",
    marginTop: 16,
    fontFamily: "Poppins-SemiBold",
  },
});