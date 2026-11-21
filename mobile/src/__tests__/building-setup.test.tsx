import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { BuildingSetupScreen } from "../screens/landlord/building-setup-screen";
import api, { endpoints } from "../services/api";

const navigation = {
  goBack: jest.fn(),
  reset: jest.fn(),
};

describe("Landlord building setup", () => {
  it("collects the room layout and facilities and saves the setup", async () => {
    jest.mocked(api.get).mockResolvedValueOnce({
      data: { pg: { name: "Willow House" } },
    } as Awaited<ReturnType<typeof api.get>>);
    jest.mocked(api.patch).mockResolvedValueOnce({
      data: { success: true },
    } as Awaited<ReturnType<typeof api.patch>>);

    await render(
      <BuildingSetupScreen
        navigation={navigation as never}
        route={{
          key: "BuildingSetup",
          name: "BuildingSetup",
          params: { onboarding: true },
        } as never}
      />
    );

    expect(await screen.findByText(/Willow House/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId("building-floor-count-increase"));
    expect(await screen.findByText("Floor 1")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("floor-1-room-count-increase"));
    expect(await screen.findByTestId("building-room-1-02")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("room-G-01-beds-increase"));
    await fireEvent(
      screen.getByTestId("water-purifier-switch"),
      "valueChange",
      true
    );
    await fireEvent(
      screen.getByTestId("mess-available-switch"),
      "valueChange",
      true
    );
    await fireEvent.press(screen.getByText("Breakfast"));
    await fireEvent.press(screen.getByText("Wi-Fi"));
    await fireEvent.press(screen.getByTestId("save-building-setup"));

    expect(api.patch).toHaveBeenCalledWith(
      endpoints.pg.buildingSetup,
      expect.objectContaining({
        floors: expect.arrayContaining([
          expect.objectContaining({
            floorNumber: 0,
            rooms: [
              expect.objectContaining({ roomNumber: "G-01", beds: 2 }),
            ],
          }),
          expect.objectContaining({
            floorNumber: 1,
            rooms: expect.arrayContaining([
              expect.objectContaining({ roomNumber: "1-02", beds: 1 }),
            ]),
          }),
        ]),
        waterPurifier: {
          available: true,
          placement: "COMMON",
          count: 1,
        },
        mess: {
          available: true,
          meals: ["BREAKFAST"],
        },
        amenities: ["WIFI"],
      })
    );
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: "Dashboard" }],
    });
  });
});
