import { fireEvent, render, screen } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ProfileSettingsScreen } from "../screens/profile/profile-screen";
import { useAuthStore } from "../store/auth.store";

const profile = {
  id: "profile-user",
  name: "Test Resident",
  email: "resident@example.com",
  phone: "9876543210",
  address: "Old address",
  role: "STUDENT" as const,
  pgId: "test-pg",
  isActive: true,
  approvalStatus: "APPROVED" as const,
};

const navigation = {
  goBack: jest.fn(),
  reset: jest.fn(),
};

describe("Profile settings screen", () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: "profile-token",
      user: profile,
      role: "STUDENT",
      pgId: "test-pg",
      isAuthenticated: true,
    });
  });

  it("loads and saves the user's editable profile fields", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: profile }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            ...profile,
            address: "New address",
          },
        }),
      } as Response);

    await render(
      <ProfileSettingsScreen
        navigation={navigation as never}
        route={{ key: "Profile", name: "Profile" } as never}
      />
    );

    expect(await screen.findByDisplayValue("Test Resident")).toBeTruthy();
    expect(screen.getByDisplayValue("resident@example.com")).toBeTruthy();
    expect(screen.getByDisplayValue("9876543210")).toBeTruthy();

    fireEvent.changeText(screen.getByDisplayValue("Old address"), "New address");
    expect(await screen.findByDisplayValue("New address")).toBeTruthy();
    fireEvent.press(screen.getByText("Save changes"));

    expect(await screen.findByText("Your profile has been updated.")).toBeTruthy();
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/auth/me"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          name: "Test Resident",
          email: "resident@example.com",
          phone: "9876543210",
          address: "New address",
        }),
      })
    );
    fetchMock.mockRestore();
  });
});
