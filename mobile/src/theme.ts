import { MD3LightTheme } from "react-native-paper";

export const COLORS = {
  background: "#FFF9F0",
  surface: "#FFFFFF",
  surfaceLow: "#F9F3EA",
  surfaceHigh: "#E7E2D9",
  primary: "#064E3B",
  primaryContainer: "#003527",
  primarySoft: "#DCFCE7",
  secondary: "#F97316",
  secondarySoft: "#FFEDD5",
  text: "#1D1B16",
  muted: "#404944",
  outline: "#707974",
  border: "#E7E2D9",
  success: "#166534",
  successSoft: "#DCFCE7",
  danger: "#BA1A1A",
  dangerSoft: "#FFEBEE",
  info: "#0B513D",
  onPrimarySoft: "#B0F0D6",
} as const;

export const nivasaTheme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.primaryContainer,
    onPrimaryContainer: COLORS.onPrimarySoft,
    secondary: COLORS.secondary,
    secondaryContainer: COLORS.secondarySoft,
    background: COLORS.background,
    surface: COLORS.surface,
    surfaceVariant: COLORS.surfaceLow,
    outline: COLORS.outline,
    error: COLORS.danger,
    errorContainer: COLORS.dangerSoft,
  },
};
