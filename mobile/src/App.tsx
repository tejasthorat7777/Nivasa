import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AppNavigator from "./router";
import { COLORS, nivasaTheme } from "./theme";

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1, backgroundColor: COLORS.background }}
      >
        <PaperProvider theme={nivasaTheme}>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" />
            <AppNavigator />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}