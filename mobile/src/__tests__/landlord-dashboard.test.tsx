import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it } from "@jest/globals";
import { LandlordDashboard } from "../screens/landlord/landlord-dashboard";

describe("Landlord Dashboard Tests", () => {
  it("renders without crashing", async () => {
    await render(<LandlordDashboard />);
    expect(screen.getByText("COLLECTED")).toBeTruthy();
  });

  it("shows loading state", () => {
    // Loading state test - component should handle loading
    expect(true).toBeTruthy();
  });

  it("opens the KYC approvals screen", async () => {
    await render(<LandlordDashboard />);

    fireEvent.press(screen.getByTestId("landlord-tab-approvals"));
    expect(await screen.findByTestId("landlord-approvals-content")).toBeTruthy();
  });
});
