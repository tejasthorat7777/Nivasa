import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import api, { endpoints } from "../services/api";
import { RoomInventory } from "../components/common/RoomInventory";

describe("Room inventory", () => {
  it("shows layout beds and assigns a student account with monthly rent", async () => {
    jest.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          rooms: [
            {
              _id: "room-1",
              roomNumber: 1,
              floor: 1,
              sharingType: "TRIPLE",
              capacity: 2,
              monthlyRent: 0,
              occupiedBeds: 0,
              status: "AVAILABLE",
              beds: [
                {
                  bedNumber: "111",
                  occupied: false,
                  monthlyRent: null,
                  student: null,
                },
                {
                  bedNumber: "112",
                  occupied: false,
                  monthlyRent: null,
                  student: null,
                },
              ],
            },
          ],
        },
      } as Awaited<ReturnType<typeof api.get>>)
      .mockResolvedValueOnce({
        data: {
          student: {
            name: "Asha Student",
            email: "asha@example.com",
            address: "Pune",
            studentCode: "A1B2C3D4E5",
          },
        },
      } as Awaited<ReturnType<typeof api.get>>);
    jest.mocked(api.post).mockResolvedValueOnce({
      data: { success: true },
    } as Awaited<ReturnType<typeof api.post>>);

    await render(<RoomInventory />);

    expect(await screen.findByTestId("bed-111")).toBeTruthy();
    expect(screen.getByTestId("bed-112")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("bed-111"));
    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByTestId("assign-student-to-bed")).toBeTruthy();
    await fireEvent.changeText(
      screen.getByTestId("bed-student-code"),
      "A1B2C3D4E5"
    );
    await fireEvent.press(screen.getByTestId("lookup-student-code"));

    expect(await screen.findByText("Asha Student")).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId("bed-monthly-rent"), "12500");
    await fireEvent.press(screen.getByTestId("assign-student-to-bed"));

    expect(api.post).toHaveBeenCalledWith(
      endpoints.students.assignBed,
      expect.objectContaining({
        roomId: "room-1",
        bedNumber: "111",
        studentCode: "A1B2C3D4E5",
        address: "Pune",
        monthlyRent: 12500,
      })
    );
  });

  it("keeps lookup errors visible above the fixed modal actions", async () => {
    const requestError = Object.assign(new Error("Lookup failed"), {
      response: {
        data: { message: "No active student account matches this code." },
      },
    });
    jest.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          rooms: [
            {
              _id: "room-1",
              roomNumber: 1,
              floor: 1,
              sharingType: "SINGLE",
              capacity: 1,
              monthlyRent: 0,
              occupiedBeds: 0,
              status: "AVAILABLE",
              beds: [
                {
                  bedNumber: "111",
                  occupied: false,
                  monthlyRent: null,
                  student: null,
                },
              ],
            },
          ],
        },
      } as Awaited<ReturnType<typeof api.get>>)
      .mockRejectedValueOnce(requestError);

    await render(<RoomInventory />);
    await fireEvent.press(await screen.findByTestId("bed-111"));
    await fireEvent.changeText(
      screen.getByTestId("bed-student-code"),
      "A1B2C3D4E5"
    );
    await fireEvent.press(screen.getByTestId("lookup-student-code"));

    expect(
      await screen.findByText(
        "No active student account matches this code."
      )
    ).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByTestId("assign-student-to-bed")).toBeTruthy();
  });

  it("explains that assigning a student will transfer them from their current PG", async () => {
    jest.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          rooms: [
            {
              _id: "room-1",
              roomNumber: 1,
              floor: 1,
              sharingType: "SINGLE",
              capacity: 1,
              monthlyRent: 0,
              occupiedBeds: 0,
              status: "AVAILABLE",
              beds: [
                {
                  bedNumber: "111",
                  occupied: false,
                  monthlyRent: null,
                  student: null,
                },
              ],
            },
          ],
        },
      } as Awaited<ReturnType<typeof api.get>>)
      .mockResolvedValueOnce({
        data: {
          student: {
            name: "Asha Student",
            email: "asha@example.com",
            address: "Pune",
            studentCode: "A1B2C3D4E5",
            currentAssignment: {
              pgName: "Willow House",
              bedNumber: "221",
              isCurrentPG: false,
            },
          },
        },
      } as Awaited<ReturnType<typeof api.get>>);

    await render(<RoomInventory />);
    await fireEvent.press(await screen.findByTestId("bed-111"));
    await fireEvent.changeText(
      screen.getByTestId("bed-student-code"),
      "A1B2C3D4E5"
    );
    await fireEvent.press(screen.getByTestId("lookup-student-code"));

    expect(
      await screen.findByText(
        "Currently assigned to Willow House, bed 221. Assigning here will transfer the student and release the old bed."
      )
    ).toBeTruthy();
  });
});
