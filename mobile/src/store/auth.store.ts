import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { User } from "../types/user.types";
import { API_BASE_URL } from "../config/api";

const authStorage = {
  getItem: (name: string) =>
    Platform.OS === "web"
      ? Promise.resolve(globalThis.localStorage.getItem(name))
      : SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) =>
    Platform.OS === "web"
      ? Promise.resolve(globalThis.localStorage.setItem(name, value))
      : SecureStore.setItemAsync(name, value),
  removeItem: (name: string) =>
    Platform.OS === "web"
      ? Promise.resolve(globalThis.localStorage.removeItem(name))
      : SecureStore.deleteItemAsync(name),
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: string | null;
  pgId: string | null;

  login: (identifier: string, password: string) => Promise<void>;
  registerLandlord: (data: any) => Promise<void>;
  registerManager: (data: any) => Promise<void>;
  registerStudent: (data: any) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      role: null,
      pgId: null,

      login: async (identifier: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: identifier, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Login failed");
          }

          const { token, user } = data;

          set({
            token,
            user,
            isAuthenticated: true,
            role: user.role,
            pgId: user.pgId,
            isLoading: false,
          });
        } catch (error: any) {
          throw new Error(error.message || "Login failed");
        } finally {
          set({ isLoading: false });
        }
      },

      registerLandlord: async (data: any) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register/landlord`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          const resData = await response.json();

          if (!response.ok) {
            throw new Error(resData.message || "Landlord registration failed");
          }

          const { token, user } = resData;

          set({
            token,
            user,
            isAuthenticated: true,
            role: user.role,
            pgId: user.pgId,
            isLoading: false,
          });
        } catch (error: any) {
          throw new Error(error.message || "Landlord registration failed");
        } finally {
          set({ isLoading: false });
        }
      },

      registerManager: async (data: any) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register/manager`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          const resData = await response.json();

          if (!response.ok) {
            throw new Error(resData.message || "Manager registration failed");
          }

          const { token, user } = resData;

          set({
            token,
            user,
            isAuthenticated: true,
            role: user.role,
            pgId: user.pgId,
            isLoading: false,
          });
        } catch (error: any) {
          throw new Error(error.message || "Manager registration failed");
        } finally {
          set({ isLoading: false });
        }
      },

      registerStudent: async (data: any) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register/student`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          const resData = await response.json();

          if (!response.ok) {
            throw new Error(resData.message || "Student registration failed");
          }

          const { token, user } = resData;

          set({
            token,
            user,
            isAuthenticated: true,
            role: user.role,
            pgId: user.pgId,
            isLoading: false,
          });
        } catch (error: any) {
          throw new Error(error.message || "Student registration failed");
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          role: null,
          pgId: null,
        });
      },

      checkSession: async () => {
        await useAuthStore.persist.rehydrate();
        const token = useAuthStore.getState().token;
        set({ isAuthenticated: Boolean(token), isLoading: false });
      },
    }),
    {
      name: "nivasa-auth",
      storage: createJSONStorage(() => authStorage),
      skipHydration: true,
    }
  )
);