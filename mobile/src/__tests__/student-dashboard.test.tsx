import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StudentDashboard } from "../screens/student/student-dashboard";
import api from "../services/api";
import { useAuthStore } from "../store/auth.store";

describe("Student Dashboard Tests", () => {
  it("renders without crashing", async () => {
    await render(<StudentDashboard />);
    expect(screen.getByText(/Hello,/)).toBeTruthy();
  });

  it("shows student home section", async () => {
    await render(<StudentDashboard />);
    expect(screen.getByText("CURRENT BILL")).toBeTruthy();
  });

  it("shows action buttons", async () => {
    await render(<StudentDashboard />);
    expect(screen.getByTestId("student-tab-bills")).toBeTruthy();
    expect(screen.getByTestId("student-tab-complaints")).toBeTruthy();
  });

  it("opens the selected dashboard section", async () => {
    await render(<StudentDashboard />);

    fireEvent.press(screen.getByTestId("student-tab-bills"));
    expect(await screen.findByTestId("student-bills-content")).toBeTruthy();

    fireEvent.press(screen.getByTestId("student-tab-complaints"));
    expect(await screen.findByTestId("student-complaints-content")).toBeTruthy();

    fireEvent.press(screen.getByTestId("student-tab-meals"));
    expect(await screen.findByTestId("student-meals-content")).toBeTruthy();
    fireEvent.press(screen.getByTestId("student-gate-pass-tab"));
    expect(await screen.findByText("Gate pass requests unavailable")).toBeTruthy();

    fireEvent.press(screen.getByTestId("student-tab-notices"));
    expect(await screen.findByTestId("student-notices-content")).toBeTruthy();

    fireEvent.press(screen.getByTestId("student-tab-home"));
    expect(await screen.findByText("CURRENT BILL")).toBeTruthy();
  });

  it("shows a linked student code, bed number, and assigned monthly rent", async () => {
    useAuthStore.setState({
      user: {
        id: "student-1",
        name: "Asha Student",
        email: "asha@example.com",
        phone: "9876543210",
        role: "STUDENT",
        approvalStatus: "APPROVED",
        studentCode: "A1B2C3D4E5",
      },
    });
    jest.mocked(api.get).mockResolvedValueOnce({
      data: {
        dashboard: {
          currentBill: null,
          roomInfo: {
            roomNumber: 1,
            floor: 1,
            bedNumber: "111",
            monthlyRent: 12500,
            sharingType: "SINGLE",
          },
          student: { monthlyRent: 12500 },
          announcements: [],
          pg: { name: "Willow House", city: "Pune" },
        },
      },
    } as Awaited<ReturnType<typeof api.get>>);

    await render(<StudentDashboard />);

    expect(await screen.findByTestId("student-code")).toHaveTextContent(
      "A1B2C3D4E5"
    );
    expect(screen.getByText("Room 1 · Bed 111")).toBeTruthy();
    expect(screen.getByText("₹12,500")).toBeTruthy();
  });
});
