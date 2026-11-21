import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./router";
import { nivasaTheme } from "./theme";

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={nivasaTheme}>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" />
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}