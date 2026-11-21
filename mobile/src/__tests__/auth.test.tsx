import { act, render, screen, fireEvent } from "@testing-library/react-native";
import { beforeEach, describe, expect, it } from "@jest/globals";
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
      expect(screen.getByText("Sign in to your account")).toBeTruthy();
      expect(screen.getByTestId("login-scroll-view")).toBeTruthy();
      expect(screen.getByPlaceholderText("Enter email or mobile number")).toBeTruthy();
      expect(screen.getByPlaceholderText("Enter your password")).toBeTruthy();
      expect(screen.queryByText("Continue with Google")).toBeNull();
      expect(screen.queryByText("Continue with Apple")).toBeNull();
      expect(screen.queryByText(/^or$/)).toBeNull();
    });

    it("keeps the welcome page scrollable", async () => {
      await render(<WelcomeScreen />);
      expect(screen.getByTestId("welcome-scroll-view")).toBeTruthy();
    });

    it("shows error on invalid login", async () => {
      await render(<LoginScreen />);
      fireEvent.press(screen.getByText("Login"));
      expect(await screen.findAllByText(/required/i)).toHaveLength(2);
    });

    it("checks a native session without browser localStorage", async () => {
      await useAuthStore.getState().checkSession();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
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
      expect(scrollView.props.keyboardShouldPersistTaps).toBe("handled");
      expect(scrollView.props.keyboardDismissMode).toBe("none");
      expect(scrollView.props.contentContainerStyle).toMatchObject({
        flexGrow: 1,
      });
    });
  });
});
