import axios, { AxiosInstance, AxiosResponse } from "axios";
import { useAuthStore } from "../store/auth.store";
import { API_BASE_URL } from "../config/api";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config: any) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;

export const endpoints = {
  auth: {
    login: "/auth/login",
    registerLandlord: "/auth/register/landlord",
    registerManager: "/auth/register/manager",
    registerStudent: "/auth/register/student",
    logout: "/auth/logout",
    me: "/auth/me",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  pg: {
    myPG: "/pg/my-pg",
    create: "/pg",
    update: "/pg/:id",
  },
  rooms: {
    list: "/rooms",
    create: "/rooms",
    update: "/rooms/:id",
    delete: "/rooms/:id",
  },
  students: {
    list: "/students",
    get: "/students/:id",
    approve: "/students/:id/approve",
    assignRoom: "/students/:id/assign-room",
    update: "/students/:id",
  },
  bills: {
    list: "/bills",
    myBills: "/bills/my-bills",
    create: "/bills",
    updatePayment: "/bills/:id/payment",
  },
  payments: {
    list: "/payments",
    create: "/payments",
    verify: "/payments/:id/verify",
  },
  complaints: {
    list: "/complaints",
    create: "/complaints",
    update: "/complaints/:id",
  },
  equipment: {
    list: "/equipment",
    create: "/equipment",
    updateStatus: "/equipment/:id",
  },
  maintenance: {
    list: "/maintenance",
    create: "/maintenance",
    update: "/maintenance/:id",
  },
  dashboard: {
    landlord: "/dashboard/landlord",
    manager: "/dashboard/manager",
    student: "/dashboard/student",
  },
  announcements: {
    list: "/announcements",
    create: "/announcements",
    delete: "/announcements/:id",
  },
  expenses: {
    list: "/expenses",
    create: "/expenses",
  },
};