import * as React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../../theme";
import { useAuthStore } from "../../store/auth.store";

export const SplashScreen = () => {
  const navigation = useNavigation();
  const checkSession = useAuthStore((state) => state.checkSession);
  const isLoading = useAuthStore((state) => state.isLoading);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    void checkSession().then(() => {
      if (cancelled) return;
      const { role, isAuthenticated } = useAuthStore.getState();
      timer = setTimeout(() => {
        navigation.navigate(isAuthenticated && role ? "Dashboard" : "Welcome");
      }, 300);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [checkSession, navigation]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.logo}>
        <Text style={styles.logoText}>N</Text>
      </View>
      <Text style={styles.tagline}>Manage. Stay. Thrive.</Text>
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        animating={isLoading}
        style={styles.indicator}
      />
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
    minHeight: 420,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: COLORS.surface,
    fontSize: 56,
    fontWeight: "800",
  },
  tagline: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 16,
    fontWeight: "600",
  },
  indicator: {
    marginTop: 24,
  },
});
