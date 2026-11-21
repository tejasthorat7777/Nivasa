import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { AppHeader } from "../components/common/AppHeader";

describe("AppHeader profile shortcut", () => {
  it("opens profile settings when the avatar is pressed", async () => {
    const onProfilePress = jest.fn();
    await render(
      <AppHeader
        name="Test Resident"
        role="Student"
        onProfilePress={onProfilePress}
      />
    );

    fireEvent.press(screen.getByTestId("app-header-profile-button"));

    expect(onProfilePress).toHaveBeenCalledTimes(1);
  });
});
