import { render, screen } from "@testing-library/react-native";
import { describe, expect, it } from "@jest/globals";
import { ManagerDashboard } from "../screens/manager/manager-dashboard";

describe("Manager Dashboard Tests", () => {
  it("renders without crashing", async () => {
    await render(<ManagerDashboard />);
    expect(screen.getByText("OPEN COMPLAINTS")).toBeTruthy();
  });

  it("shows dashboard header", async () => {
    await render(<ManagerDashboard />);
    expect(screen.getAllByText("Rooms & Beds").length).toBeGreaterThan(0);
  });
});
