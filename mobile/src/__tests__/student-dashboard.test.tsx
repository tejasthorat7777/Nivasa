import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it } from "@jest/globals";
import { StudentDashboard } from "../screens/student/student-dashboard";

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

    fireEvent.press(screen.getByTestId("student-tab-notices"));
    expect(await screen.findByTestId("student-notices-content")).toBeTruthy();

    fireEvent.press(screen.getByTestId("student-tab-home"));
    expect(await screen.findByText("CURRENT BILL")).toBeTruthy();
  });
});
