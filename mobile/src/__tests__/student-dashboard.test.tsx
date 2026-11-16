import { render, screen } from "@testing-library/react-native";
import { describe, it, expect } from "vitest";
import { StudentDashboard } from "../screens/student/student-dashboard";

describe("Student Dashboard Tests", () => {
  it("renders without crashing", () => {
    render(<StudentDashboard />);
    expect(screen.getByText("Welcome")).toBeTruthy();
  });

  it("shows student home section", () => {
    render(<StudentDashboard />);
    expect(screen.getByText("Monthly Rent")).toBeTruthy();
  });

  it("shows action buttons", () => {
    render(<StudentDashboard />);
    expect(screen.getByText("Bills")).toBeTruthy();
    expect(screen.getByText("Complaints")).toBeTruthy();
  });
});
