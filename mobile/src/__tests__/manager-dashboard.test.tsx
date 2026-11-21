import { fireEvent, render, screen } from "@testing-library/react-native";
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

  it("opens maintenance, cleaning, and staff desks", async () => {
    await render(<ManagerDashboard />);

    fireEvent.press(screen.getByTestId("manager-tab-maintenance"));
    expect(await screen.findByTestId("manager-maintenance-content")).toBeTruthy();

    fireEvent.press(screen.getByTestId("manager-tab-cleaning"));
    expect(await screen.findByTestId("manager-cleaning-content")).toBeTruthy();

    fireEvent.press(screen.getByTestId("manager-tab-staff"));
    expect(await screen.findByTestId("manager-staff-content")).toBeTruthy();
  });
});
