import * as React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BrandLogo } from "../../components/common/BrandLogo";
import { COLORS } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation.types";

export const SplashScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
      <BrandLogo width={216} height={72} />
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
  indicator: {
    marginTop: 24,
  },
});
