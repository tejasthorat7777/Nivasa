import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../theme";

interface AppHeaderProps {
  name?: string;
  role: string;
  propertyName?: string;
  location?: string;
}

export const AppHeader = ({
  name,
  role,
  propertyName = "Nivasa",
  location,
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
        <View style={styles.logo}>
          <Text style={styles.logoText}>N</Text>
        </View>
        <View style={styles.brandCopy}>
          <Text numberOfLines={1} style={styles.propertyName}>
            {propertyName}
          </Text>
          <Text numberOfLines={1} style={styles.meta}>
            {[location, role].filter(Boolean).join(" • ")}
          </Text>
        </View>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials || "N"}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    paddingVertical: 8,
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
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: COLORS.surface,
    fontSize: 22,
    fontWeight: "800",
  },
  brandCopy: {
    flex: 1,
    marginLeft: 10,
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
