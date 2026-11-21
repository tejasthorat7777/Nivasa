import { act, render, screen, fireEvent } from "@testing-library/react-native";
import { beforeEach, describe, expect, it } from "@jest/globals";
import * as SecureStore from "expo-secure-store";
import { LoginScreen } from "../screens/auth/login-screen";
import { RegisterScreen } from "../screens/auth/register-screen";
import { WelcomeScreen } from "../screens/auth/welcome-screen";
import { useAuthStore } from "../store/auth.store";

describe("Mobile Authentication Tests", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  describe("Login Screen", () => {
    it("renders login form", async () => {
      await render(<LoginScreen />);
      expect(screen.getByText("Welcome Back")).toBeTruthy();
      expect(screen.getByTestId("login-scroll-view")).toBeTruthy();
      expect(screen.getByTestId("login-role-student")).toBeTruthy();
      expect(screen.getByTestId("login-role-manager")).toBeTruthy();
      expect(screen.getByTestId("login-role-landlord")).toBeTruthy();
      expect(screen.getByText("Phone Number or Email")).toBeTruthy();
      expect(screen.getByText("Password")).toBeTruthy();
      expect(
        screen.queryByPlaceholderText("98765 43210 or name@email.com")
      ).toBeNull();
      expect(screen.queryByPlaceholderText("••••••••••••")).toBeNull();
      expect(screen.getByText("Keep me logged in for 30 days")).toBeTruthy();
      expect(screen.getByText("Login to Account   →")).toBeTruthy();
      expect(screen.queryByText("Use Fingerprint / Face ID")).toBeNull();
      expect(screen.getByText("WhatsApp OTP")).toBeTruthy();
      expect(screen.getByText("Google")).toBeTruthy();
      expect(screen.queryByText("Continue with Google")).toBeNull();
      expect(screen.queryByText("Continue with Apple")).toBeNull();
      expect(screen.queryByText(/^or$/)).toBeNull();
    });

    it("keeps the welcome page scrollable", async () => {
      await render(<WelcomeScreen />);
      expect(screen.getByTestId("welcome-scroll-view")).toBeTruthy();
      expect(
        screen.getByLabelText("Nivasa — Manage. Stay. Thrive.")
      ).toBeTruthy();
    });

    it("shows error on invalid login", async () => {
      await render(<LoginScreen />);
      fireEvent.press(screen.getByText("Login to Account   →"));
      expect(await screen.findAllByText(/required/i)).toHaveLength(2);
    });

    it("checks a native session without browser localStorage", async () => {
      await useAuthStore.getState().checkSession();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it("restores a saved session and its role from secure storage", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          state: {
            token: "saved-token",
            role: "LANDLORD",
            user: {
              id: "saved-user",
              name: "Saved Landlord",
              email: "landlord@example.com",
              phone: "9876543210",
              role: "LANDLORD",
            },
            pgId: "saved-pg",
            isAuthenticated: true,
            isLoading: false,
          },
          version: 0,
        })
      );

      await useAuthStore.getState().checkSession();

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().role).toBe("LANDLORD");
      expect(useAuthStore.getState().token).toBe("saved-token");
    });

    it("sends a mobile number to the login endpoint", async () => {
      const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          token: "test-token",
          user: {
            id: "test-user",
            name: "Test Student",
            email: "student@example.com",
            role: "STUDENT",
            pgId: "test-pg",
          },
        }),
      } as Response);

      await act(async () => {
        await useAuthStore.getState().login("9876543210", "password123");
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login"),
        expect.objectContaining({
          body: JSON.stringify({ email: "9876543210", password: "password123" }),
        })
      );
      fetchMock.mockRestore();
    });
  });

  describe("Register Screen", () => {
    it("renders registration form", async () => {
      await render(<RegisterScreen />);
      expect(screen.getByText("Register")).toBeTruthy();
      expect(screen.getByPlaceholderText("Enter your email")).toBeTruthy();
      expect(screen.getByPlaceholderText("Enter password")).toBeTruthy();
    });

    it("shows a scrollable registration form for the keyboard", async () => {
      await render(<RegisterScreen />);
      const scrollView = screen.getByTestId("registration-scroll-view");

      expect(screen.getByText("Student Registration")).toBeTruthy();
      expect(screen.getByPlaceholderText("Enter invitation code")).toBeTruthy();
      expect(screen.queryByPlaceholderText("Enter total rooms")).toBeNull();
      expect(scrollView.props.keyboardShouldPersistTaps).toBe("handled");
      expect(scrollView.props.keyboardDismissMode).toBe("none");
      expect(scrollView.props.contentContainerStyle).toMatchObject({
        flexGrow: 1,
      });
    });

    it("switches between student, manager, and landlord registration forms", async () => {
      await render(<RegisterScreen />);

      fireEvent.press(screen.getByTestId("register-role-manager"));
      expect(await screen.findByText("Manager Registration")).toBeTruthy();
      expect(screen.getByPlaceholderText("Enter invitation code")).toBeTruthy();
      expect(screen.queryByPlaceholderText("Enter college name")).toBeNull();

      fireEvent.press(screen.getByTestId("register-role-landlord"));
      expect(await screen.findByText("Landlord Registration")).toBeTruthy();
      expect(screen.getByPlaceholderText("Enter PG name")).toBeTruthy();
      expect(screen.getByPlaceholderText("Enter PG address")).toBeTruthy();
      expect(screen.queryByPlaceholderText("Enter total rooms")).toBeNull();
      expect(screen.queryByPlaceholderText("Enter invitation code")).toBeNull();
    });
  });
});
