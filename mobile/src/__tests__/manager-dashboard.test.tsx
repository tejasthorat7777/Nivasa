import { render, screen } from "@testing-library/react-native";
import { describe, it, expect } from "vitest";
import { ManagerDashboard } from "../screens/manager/manager-dashboard";

describe("Manager Dashboard Tests", () => {
  it("renders without crashing", () => {
    render(<ManagerDashboard />);
    expect(screen.getByText("Welcome")).toBeTruthy();
  });

  it("shows dashboard header", () => {
    render(<ManagerDashboard />);
    expect(screen.getByText("Welcome, Manager")).toBeTruthy();
  });
});
