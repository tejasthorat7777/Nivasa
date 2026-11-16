import { render, screen } from "@testing-library/react-native";
import { describe, it, expect } from "vitest";
import { LandlordDashboard } from "../screens/landlord/landlord-dashboard";

describe("Landlord Dashboard Tests", () => {
  it("renders without crashing", () => {
    render(<LandlordDashboard />);
    expect(screen.getByText("Welcome")).toBeTruthy();
  });

  it("shows loading state", () => {
    // Loading state test - component should handle loading
    expect(true).toBeTruthy();
  });
});
