import * as React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

interface BrandLogoProps {
  width: number;
  height: number;
  style?: StyleProp<ImageStyle>;
}

export const BrandLogo = ({ width, height, style }: BrandLogoProps) => (
  <Image
    accessible
    accessibilityLabel="Nivasa — Manage. Stay. Thrive."
    resizeMode="contain"
    source={require("../../assets/nivasa-logo.png")}
    style={[{ width, height }, style]}
  />
);
