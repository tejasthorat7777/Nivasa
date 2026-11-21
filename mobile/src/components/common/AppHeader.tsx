import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BrandLogo } from "./BrandLogo";
import { COLORS } from "../../theme";

interface AppHeaderProps {
  name?: string;
  role: string;
  propertyName?: string;
  location?: string;
  onProfilePress?: () => void;
}

export const AppHeader = ({
  name,
  role,
  propertyName = "Nivasa",
  location,
  onProfilePress,
}: AppHeaderProps) => {
  const initials = name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <BrandLogo width={108} height={40} />
        <View style={styles.brandCopy}>
          <Text numberOfLines={1} style={styles.propertyName}>
            {propertyName}
          </Text>
          <Text numberOfLines={1} style={styles.meta}>
            {[location, role].filter(Boolean).join(" • ")}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel="Open profile and settings"
        accessibilityRole="button"
        disabled={!onProfilePress}
        onPress={onProfilePress}
        style={styles.avatar}
        testID="app-header-profile-button"
      >
        <Text style={styles.avatarText}>{initials || "N"}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brand: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },
  propertyName: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
    textTransform: "capitalize",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
});
