import * as React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BrandLogo } from "../../components/common/BrandLogo";
import { COLORS } from "../../theme";
import type { RootStackParamList } from "../../navigation.types";

export const WelcomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView
      testID="welcome-scroll-view"
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <BrandLogo width={216} height={72} style={styles.logo} />
      <Text style={styles.eyebrow}>WELCOME TO YOUR PG</Text>
      <Text style={styles.title}>A better way to manage your stay.</Text>
      <Text style={styles.subtitle}>
        Rent, room details and PG updates, all in one calm and simple space.
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Everything in one place</Text>
        <Text style={styles.infoText}>
          Stay connected with your PG, keep up with bills and get important
          notices from your manager.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          contentStyle={styles.buttonContent}
          onPress={() => navigation.navigate("Login")}
        >
          Login
        </Button>
        <Button
          mode="outlined"
          contentStyle={styles.buttonContent}
          onPress={() => navigation.navigate("Register")}
        >
          Create Account
        </Button>
      </View>
      <Text style={styles.footer}>A more comfortable stay starts here.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logo: {
    marginBottom: 24,
  },
  eyebrow: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    maxWidth: 360,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.muted,
    marginBottom: 28,
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
  },
  actions: {
    gap: 12,
  },
  buttonContent: {
    minHeight: 48,
  },
  footer: {
    color: COLORS.outline,
    fontSize: 12,
    textAlign: "center",
    marginTop: 24,
  },
});
