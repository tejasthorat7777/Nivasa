import { MD3LightTheme } from "react-native-paper";

export const COLORS = {
  background: "#F8F9FF",
  surface: "#FFFFFF",
  surfaceLow: "#EFF4FF",
  surfaceHigh: "#E6EEFF",
  primary: "#00236F",
  primaryContainer: "#1E3A8A",
  secondary: "#FD761A",
  secondarySoft: "#FFDBCA",
  text: "#121C2A",
  muted: "#444651",
  outline: "#757682",
  border: "#E2E8F0",
  success: "#16A34A",
  danger: "#BA1A1A",
  info: "#38BDF8",
} as const;

export const nivasaTheme = {
  ...MD3LightTheme,
  roundness: 8,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    surfaceVariant: COLORS.surfaceLow,
    outline: COLORS.outline,
    error: COLORS.danger,
  },
};
