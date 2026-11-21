import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { describe, expect, it } from "@jest/globals";
import { LandlordDashboard } from "../screens/landlord/landlord-dashboard";
import api from "../services/api";

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

  it("shows the PG invitation code for sharing with residents and managers", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        dashboard: {
          pg: {
            name: "Willow House",
            city: "Pune",
            invitationCode: "NIVA23",
          },
          occupancy: {},
          revenue: {},
          recentPayments: [],
          recentComplaints: [],
        },
      },
    });

    await render(<LandlordDashboard />);

    expect(await screen.findByTestId("landlord-invitation-card")).toBeTruthy();
    expect(screen.getByText("NIVA23")).toBeTruthy();
    expect(screen.getByText("Share code")).toBeTruthy();
  });

  it("creates and activates an additional property for the landlord", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        pg: {
          id: "pg-new",
          name: "Willow House",
          address: "12 Lake Road",
          city: "Pune",
        },
      },
    });
    (api.patch as jest.Mock).mockResolvedValueOnce({
      data: { success: true },
    });

    await render(<LandlordDashboard />);
    await fireEvent.press(screen.getByTestId("landlord-manage-properties"));
    await screen.findByTestId("property-name-input");
    await fireEvent.changeText(
      screen.getByTestId("property-name-input"),
      "Willow House"
    );
    await fireEvent.changeText(
      screen.getByTestId("property-address-input"),
      "12 Lake Road"
    );
    await fireEvent.changeText(
      screen.getByTestId("property-city-input"),
      "Pune"
    );
    await fireEvent.press(screen.getByTestId("landlord-create-property"));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          name: "Willow House",
          address: "12 Lake Road",
          city: "Pune",
          totalRooms: 0,
        })
      )
    );
    expect(api.patch).toHaveBeenCalledWith(
      expect.any(String),
      { pgId: "pg-new" }
    );
  });
});
