import mongoose from "mongoose";
import type { BuildingSetupData } from "../validators/pg.validators";
import { Room } from "../models/room.model";
import { StudentProfile } from "../models/studentprofile.model";

export const getBedNumber = (
  floor: number,
  roomNumber: number,
  bedIndex: number
) => `${floor}${roomNumber}${bedIndex}`;

const getRoomNumber = (label: string) => {
  const suffix = label.match(/(\d+)$/)?.[1];
  const roomNumber = Number(suffix);
  if (!suffix || !Number.isSafeInteger(roomNumber) || roomNumber < 1) {
    throw new Error(`Room number "${label}" must end with a positive number.`);
  }
  return roomNumber;
};

const getSharingType = (capacity: number) => {
  if (capacity === 1) return "SINGLE";
  if (capacity === 2) return "DOUBLE";
  if (capacity === 3) return "TRIPLE";
  return "MULTI";
};

export class RoomInventoryConflictError extends Error {}

const getConfiguredRooms = (setup: BuildingSetupData) =>
  setup.floors.flatMap((floor) =>
    floor.rooms.map((room) => ({
      floor: floor.floorNumber,
      roomNumber: getRoomNumber(room.roomNumber),
      capacity: room.beds,
    }))
  );

const loadExistingRooms = async (
  pgId: string | mongoose.Types.ObjectId,
  setup: BuildingSetupData
) => {
  const configuredRooms = getConfiguredRooms(setup);
  const existingRooms = await Room.find({
    pgId,
    $or: configuredRooms.map(({ floor, roomNumber }) => ({ floor, roomNumber })),
  });
  const roomIds = existingRooms.map((room) => room._id);
  const assignedStudents = roomIds.length
    ? await StudentProfile.find({
        roomId: { $in: roomIds },
        status: "ACTIVE",
      }).select("roomId")
    : [];
  const assignedCounts = new Map<string, number>();
  for (const student of assignedStudents) {
    const roomId = student.roomId.toString();
    assignedCounts.set(roomId, (assignedCounts.get(roomId) ?? 0) + 1);
  }
  const roomMap = new Map(
    existingRooms.map((room) => [`${room.floor}:${room.roomNumber}`, room])
  );

  for (const configuredRoom of configuredRooms) {
    const existing = roomMap.get(
      `${configuredRoom.floor}:${configuredRoom.roomNumber}`
    );
    if (
      existing &&
      configuredRoom.capacity <
        Math.max(
          existing.occupiedBeds,
          assignedCounts.get(existing._id.toString()) ?? 0
        )
    ) {
      throw new RoomInventoryConflictError(
        `Room ${configuredRoom.roomNumber} on floor ${configuredRoom.floor} has more occupied beds than the new capacity.`
      );
    }
  }

  return { configuredRooms, roomMap };
};

export const validateRoomCapacities = async (
  pgId: string | mongoose.Types.ObjectId,
  setup: BuildingSetupData
) => {
  await loadExistingRooms(pgId, setup);
};

export const ensureRoomsFromBuildingSetup = async (
  pgId: string | mongoose.Types.ObjectId,
  setup: BuildingSetupData
) => {
  const { configuredRooms, roomMap } = await loadExistingRooms(pgId, setup);
  for (const configuredRoom of configuredRooms) {
    const room = roomMap.get(
      `${configuredRoom.floor}:${configuredRoom.roomNumber}`
    );

    if (!room) {
      await Room.create({
        pgId,
        floor: configuredRoom.floor,
        roomNumber: configuredRoom.roomNumber,
        sharingType: getSharingType(configuredRoom.capacity),
        capacity: configuredRoom.capacity,
        monthlyRent: 0,
        occupiedBeds: 0,
        status: "AVAILABLE",
        facilities: [],
      });
      continue;
    }

    if (room.capacity !== configuredRoom.capacity) {
      room.capacity = configuredRoom.capacity;
      room.sharingType = getSharingType(configuredRoom.capacity);
      await room.save();
    }
  }
};
