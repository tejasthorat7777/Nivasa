import axios, { AxiosInstance, AxiosResponse } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "http://10.0.2.2:4000/api", // Expo Android emulator
  // baseURL: "http://localhost:4000/api", // Expo on physical device with LAN
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config: any) => {
    const token = localStorage.getItem("nivasa_token");
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
      // Token expired or invalid - clear auth
      localStorage.removeItem("nivasa_token");
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