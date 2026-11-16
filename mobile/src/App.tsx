import "react-native-gesture-handler/jsx";
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-barcode-scanner";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/store/auth.store";
import router from "./src/router";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer ref={router}>
          <StatusBar barStyle="dark-content" />
          <router />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}