import { render, screen, fireEvent } from "@testing-library/react-native";
import { describe, it, expect, beforeEach } from "vitest";
import { LoginScreen } from "../screens/auth/login-screen";
import { RegisterScreen } from "../screens/auth/register-screen";
import { useAuthStore } from "../store/auth.store";

describe("Mobile Authentication Tests", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  describe("Login Screen", () => {
    it("renders login form", () => {
      render(<LoginScreen />);
      expect(screen.getByText("Welcome Back")).toBeTruthy();
      expect(screen.getByLabelText("email")).toBeTruthy();
      expect(screen.getByLabelText("password")).toBeTruthy();
    });

    it("shows error on invalid login", () => {
      render(<LoginScreen />);
      fireEvent.press(screen.getByText("Login"));
      expect(screen.getByText(/login failed|invalid|error|invalid login/i)).toBeTruthy();
    });
  });

  describe("Register Screen", () => {
    it("renders registration form", () => {
      render(<RegisterScreen />);
      expect(screen.getByText("Register")).toBeTruthy();
      expect(screen.getByLabelText("email")).toBeTruthy();
      expect(screen.getByLabelText("password")).toBeTruthy();
    });

    it("should show registration options", () => {
      render(<RegisterScreen />);
      expect(screen.getByText("Landlord")).toBeTruthy();
      expect(screen.getByText("Manager")).toBeTruthy();
      expect(screen.getByText("Student")).toBeTruthy();
    });
  });
