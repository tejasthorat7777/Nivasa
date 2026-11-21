import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation.types";
import { useAuthStore } from "../../store/auth.store";
import { COLORS } from "../../theme";

type ProfileSettingsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Profile"
>;

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const profileFormFromUser = (
  user: ReturnType<typeof useAuthStore.getState>["user"]
): ProfileForm => ({
  name: user?.name ?? "",
  email: user?.email ?? "",
  phone: user?.phone ?? "",
  address: user?.address ?? "",
});

export const ProfileSettingsScreen = ({
  navigation,
}: ProfileSettingsScreenProps) => {
  const user = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);
  const [form, setForm] = React.useState(() => profileFormFromUser(user));
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  React.useEffect(() => {
    let active = true;
    refreshProfile()
      .then(() => {
        if (active) {
          setForm(profileFormFromUser(useAuthStore.getState().user));
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load your profile."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshProfile]);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    const profile = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };

    if (profile.name.length < 2) {
      setError("Enter a name with at least 2 characters.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (profile.phone.length < 7 || profile.phone.length > 15) {
      setError("Enter a phone number between 7 and 15 characters.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateProfile(profile);
      setForm(profileFormFromUser(useAuthStore.getState().user));
      setSuccess("Your profile has been updated.");
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const initials = form.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text style={styles.backText}>‹  Back</Text>
      </Pressable>

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "N"}</Text>
        </View>
        <Text style={styles.title}>Profile & Settings</Text>
        <Text style={styles.subtitle}>
          Update the contact details on your Nivasa account.
        </Text>
        {user?.role && (
          <Text style={styles.roleBadge}>{user.role.toLowerCase()}</Text>
        )}
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.muted}>Loading your account details...</Text>
        </View>
      )}

      <View style={styles.form}>
        <TextInput
          autoCapitalize="words"
          disabled={loading || saving}
          label="Full name"
          mode="outlined"
          onChangeText={(value) => updateField("name", value)}
          value={form.name}
        />
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          disabled={loading || saving}
          keyboardType="email-address"
          label="Email address"
          mode="outlined"
          onChangeText={(value) => updateField("email", value)}
          value={form.email}
        />
        <TextInput
          autoComplete="tel"
          disabled={loading || saving}
          keyboardType="phone-pad"
          label="Phone number"
          mode="outlined"
          onChangeText={(value) => updateField("phone", value)}
          value={form.phone}
        />
        <TextInput
          disabled={loading || saving}
          label="Address"
          mode="outlined"
          multiline
          numberOfLines={3}
          onChangeText={(value) => updateField("address", value)}
          value={form.address}
        />
      </View>

      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      {!!success && <Text style={styles.success}>{success}</Text>}

      <Button
        disabled={loading || saving}
        loading={saving}
        mode="contained"
        onPress={handleSave}
        style={styles.saveButton}
      >
        Save changes
      </Button>
      <Button
        disabled={saving}
        mode="outlined"
        onPress={handleSignOut}
        textColor={COLORS.danger}
      >
        Sign out
      </Button>
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
    padding: 24,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  identity: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
    marginBottom: 12,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  title: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  roleBadge: {
    color: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    textTransform: "capitalize",
    fontSize: 12,
    fontWeight: "700",
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  muted: {
    color: COLORS.muted,
    fontSize: 13,
  },
  form: {
    gap: 14,
  },
  error: {
    color: COLORS.danger,
    fontSize: 14,
    marginTop: 12,
  },
  success: {
    color: COLORS.success,
    fontSize: 14,
    marginTop: 12,
  },
  saveButton: {
    marginTop: 20,
    marginBottom: 12,
  },
});
