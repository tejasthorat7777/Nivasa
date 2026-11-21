import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../theme";

interface FeatureEmptyStateProps {
  icon: string;
  title: string;
  message: string;
}

export const FeatureEmptyState = ({
  icon,
  title,
  message,
}: FeatureEmptyStateProps) => (
  <View style={styles.container}>
    <View style={styles.icon}>
      <Text style={styles.iconText}>{icon}</Text>
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
  },
  iconText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "700",
  },
  title: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});
