import { extendTheme } from "@expo/metro-config";

// Color palette following Nivasa branding
const colors = {
  primary: "#1E40AF",        // Navy blue
  primaryLight: "#3B82F6",   // Light blue
  secondary: "#F97316",      // Orange accent
  success: "#10B981",        // Green
  warning: "#F59E0B",        // Yellow
  error: "#EF4444",          // Red
  background: "#F8FAFC",     // Light gray background
  surface: "#FFFFFF",        // White surfaces
  card: "#F9FAFB",          // Card background
  text: "#1F2937",          // Dark text
  textSecondary: "#6B7280", // Secondary text
  border: "#D1D5DB",        // Border color
  bgGray: "#F3F4F6",        // Gray background
};

const typography = {
  // Using Poppins for headings and Inter for body
  heading: {
    fontFamily: "Poppins-SemiBold",
    color: "#1F2937",
  },
  body: {
    fontFamily: "Inter-Regular",
    color: "#1F2937",
    fontSize: 16,
  },
  caption: {
    fontFamily: "Inter-Regular",
    color: "#6B7280",
    fontSize: 12,
  },
  button: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    fontWeight: "600",
  },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const theme = extendTheme({
  colors,
  typography,
  spacing,
  components: {
    // Base component styles
    Button: {
      baseStyle: {
        borderRadius: "md",
        fontWeight: "600",
      },
      variants: {
        primary: {
          bg: "#1E40AF",
          color: "#FFFFFF",
          _hover: {
            bg: "#3B82F6",
          },
        },
        secondary: {
          bg: "#F97316",
          color: "#FFFFFF",
          _hover: {
            bg: "#EA580C",
          },
        },
        ghost: {
          bg: "transparent",
          color: "#1E40AF",
          _hover: {
            bg: "#F3F4F6",
          },
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: "md",
          _focus: {
            borderColor: "#1E40AF",
            boxShadow: "0 0 0 2px rgba(30, 64, 175, 0.1)",
          },
        },
      },
    },
    Card: {
      baseStyle: {
        borderRadius: "lg",
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 1,
      },
    },
  },
});

export default theme;