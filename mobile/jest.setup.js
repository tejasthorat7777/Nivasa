globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock("./src/services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(async () => ({
      data: {
        rooms: [],
        dashboard: {
          currentBill: null,
          roomInfo: null,
          announcements: [],
          openComplaints: 0,
          pendingMaintenance: 0,
          equipmentFailures: 0,
          completedTasks: 0,
          occupancy: {
            totalRooms: 0,
            occupiedRooms: 0,
            availableRooms: 0,
          },
          revenue: {
            rentCollected: 0,
            pendingRent: 0,
            monthlyExpenses: 0,
            netIncome: 0,
          },
        },
      },
    })),
  },
  endpoints: {
    dashboard: {
      student: "/dashboard/student",
      manager: "/dashboard/manager",
      landlord: "/dashboard/landlord",
    },
  },
}));
