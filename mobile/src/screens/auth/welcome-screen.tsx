import * as React from "react";
import { View, Text, Button, Image, StyleSheet } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/auth.store";

export const WelcomeScreen = () => {
  const navigation = useNavigation();
  const { checkSession } = useAuthStore.getState();

  // Check if already authenticated on first load
  React.useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/nivasa-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Manage your PG, all in one place.</Text>
      <Text style={styles.subtitle}>StayNest - Nivasa</Text>
      <Button mode="contained" onPress={() => navigation.navigate("Login")}>
        <Text style={styles.buttonText}>Login</Text>
      </Button>
      <Button mode="contained" onPress={() => navigation.navigate("Register")}>
        <Text style={styles.buttonText}>Create Account</Text>
      </Button>
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
    width: 120,
    height: 120,
    marginBottom: 20,
    backgroundColor: "#1E40AF",
    borderRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  buttonText: {
    color: "#1E40AF",
    fontWeight: "600",
  },
});