import * as React from "react";
import {
  KeyboardAvoidingView,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import api, { endpoints } from "../../services/api";
import { COLORS } from "../../theme";

type RoomFilter = "ALL" | "AVAILABLE" | "PARTIAL" | "FULL";

interface Student {
  name: string;
  email: string;
  address: string;
  studentCode: string;
  currentAssignment?: {
    pgName: string;
    bedNumber?: string;
    isCurrentPG: boolean;
  } | null;
}

interface Bed {
  bedNumber: string;
  occupied: boolean;
  monthlyRent: number | null;
  student: Student | null;
}

interface Room {
  _id: string;
  roomNumber: number | string;
  floor: number;
  sharingType: string;
  capacity: number;
  monthlyRent: number;
  occupiedBeds: number;
  status: string;
  facilities?: string[];
  beds?: Bed[];
}

interface SelectedBed {
  roomId: string;
  roomNumber: number | string;
  floor: number;
  bed: Bed;
}

const filters: RoomFilter[] = ["ALL", "AVAILABLE", "PARTIAL", "FULL"];
const getFloorLabel = (floor: number) =>
  floor === 0 ? "Ground floor" : `Floor ${floor}`;

const getBeds = (room: Room): Bed[] =>
  room.beds ??
  Array.from({ length: room.capacity }, (_, index) => ({
    bedNumber: `${room.floor}${room.roomNumber}${index + 1}`,
    occupied: index < room.occupiedBeds,
    monthlyRent: null,
    student: null,
  }));

const getOccupiedCount = (room: Room) =>
  room.beds
    ? room.beds.filter((bed) => bed.occupied).length
    : room.occupiedBeds ?? 0;

const getRequestError = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error.response;
    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response &&
      typeof response.data === "object" &&
      response.data !== null &&
      "message" in response.data &&
      typeof response.data.message === "string"
    ) {
      return response.data.message;
    }
  }
  return error instanceof Error ? error.message : fallback;
};

export const RoomInventory = () => {
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<RoomFilter>("ALL");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retry, setRetry] = React.useState(0);
  const [selectedBed, setSelectedBed] = React.useState<SelectedBed | null>(null);
  const [studentCode, setStudentCode] = React.useState("");
  const [matchedStudent, setMatchedStudent] = React.useState<Student | null>(
    null
  );
  const [address, setAddress] = React.useState("");
  const [monthlyRent, setMonthlyRent] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [lookingUp, setLookingUp] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    const loadRooms = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(endpoints.rooms.list);
        if (active) setRooms(response.data.rooms ?? []);
      } catch (requestError: unknown) {
        if (!active) return;
        setError(getRequestError(requestError, "Unable to load rooms."));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadRooms();
    return () => {
      active = false;
    };
  }, [retry]);

  const visibleRooms = rooms.filter((room) => {
    const occupied = getOccupiedCount(room);
    const capacity = room.capacity ?? 0;
    const matchesFilter =
      filter === "ALL" ||
      (filter === "AVAILABLE" && occupied === 0) ||
      (filter === "PARTIAL" && occupied > 0 && occupied < capacity) ||
      (filter === "FULL" && capacity > 0 && occupied >= capacity);
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      [
        room.roomNumber,
        room.floor,
        room.sharingType,
        ...getBeds(room).map((bed) => bed.bedNumber),
        ...(room.facilities ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesFilter && matchesQuery;
  });

  const capacity = rooms.reduce((total, room) => total + (room.capacity || 0), 0);
  const occupied = rooms.reduce(
    (total, room) => total + getOccupiedCount(room),
    0
  );
  const available = Math.max(0, capacity - occupied);

  const openBed = (room: Room, bed: Bed) => {
    setSelectedBed({
      roomId: room._id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      bed,
    });
    setStudentCode("");
    setMatchedStudent(null);
    setAddress("");
    setMonthlyRent("");
    setFormError(null);
  };

  const closeBed = () => {
    if (saving || lookingUp) return;
    setSelectedBed(null);
    setFormError(null);
  };

  const lookupStudent = async () => {
    Keyboard.dismiss();
    const normalizedCode = studentCode.trim().toUpperCase();
    if (!/^[A-F0-9]{10}$/.test(normalizedCode)) {
      setFormError("Enter the 10-character student code from their dashboard.");
      return;
    }

    setLookingUp(true);
    setFormError(null);
    setMatchedStudent(null);
    try {
      const { data } = await api.get(
        `${endpoints.students.lookup}/${encodeURIComponent(normalizedCode)}`
      );
      if (!data.student) {
        throw new Error("The server did not return a student account.");
      }
      setMatchedStudent(data.student);
      setAddress(data.student.address ?? "");
    } catch (requestError: unknown) {
      setFormError(
        getRequestError(
          requestError,
          "Unable to find a student with this code."
        )
      );
    } finally {
      setLookingUp(false);
    }
  };

  const assignStudent = async () => {
    Keyboard.dismiss();
    if (!selectedBed || !matchedStudent) {
      setFormError("Find a student account before assigning this bed.");
      return;
    }

    const rent = Number(monthlyRent);
    if (!Number.isFinite(rent) || rent < 1) {
      setFormError("Enter a monthly rent greater than zero.");
      return;
    }
    if (address.trim().length < 2) {
      setFormError("Enter the student's address.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const { data } = await api.post(endpoints.students.assignBed, {
        roomId: selectedBed.roomId,
        bedNumber: selectedBed.bed.bedNumber,
        studentCode: matchedStudent.studentCode,
        address: address.trim(),
        monthlyRent: rent,
      });
      if (!data.success) {
        throw new Error(data.message || "Unable to assign this bed.");
      }
      setSelectedBed(null);
      setRetry((value) => value + 1);
    } catch (requestError: unknown) {
      setFormError(
        getRequestError(requestError, "Unable to assign this bed.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>LIVE INVENTORY</Text>
        <Text style={styles.title}>Rooms & Beds</Text>
        <Text style={styles.subtitle}>
          Select an empty numbered bed to assign a student and set their rent.
        </Text>

        <TextInput
          mode="outlined"
          label="Search rooms or bed numbers"
          value={query}
          onChangeText={setQuery}
          activeOutlineColor={COLORS.primary}
          outlineColor={COLORS.border}
          style={styles.search}
        />

        <View style={styles.filterRow}>
          {filters.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => setFilter(item)}
              style={[
                styles.filterChip,
                filter === item && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}
              >
                {item === "ALL" ? `All (${rooms.length})` : item}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryTitle}>
              {occupied} / {capacity} beds occupied
            </Text>
            <Text style={styles.subtitle}>
              {capacity > 0
                ? `${Math.round((occupied / capacity) * 100)}% occupancy`
                : "No room inventory yet"}
            </Text>
          </View>
          <Text style={styles.vacantBadge}>{available} vacant</Text>
        </View>

        {loading ? (
          <Text style={styles.subtitle}>Loading rooms...</Text>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={() => setRetry((value) => value + 1)}>
              Retry
            </Button>
          </View>
        ) : visibleRooms.length > 0 ? (
          visibleRooms.map((room) => (
            <RoomCard key={room._id} room={room} onSelectBed={openBed} />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>
              {rooms.length ? "No rooms match these filters" : "No rooms added yet"}
            </Text>
            <Text style={styles.subtitle}>
              {rooms.length
                ? "Try a different search or availability filter."
                : "Save the building layout first; its rooms and beds will appear here."}
            </Text>
          </View>
        )}
      </View>

      <Modal
        visible={selectedBed !== null}
        transparent
        animationType="slide"
        onRequestClose={closeBed}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKeyboard}
          >
            {selectedBed && (
              <View style={styles.modalCard}>
                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.eyebrow}>
                    {getFloorLabel(selectedBed.floor).toUpperCase()} · ROOM{" "}
                    {selectedBed.roomNumber}
                  </Text>
                  <Text style={styles.modalTitle}>
                    Bed {selectedBed.bed.bedNumber}
                  </Text>

                  {selectedBed.bed.occupied ? (
                    <>
                      <Text style={styles.subtitle}>This bed is assigned.</Text>
                      <Text style={styles.cardTitle}>
                        {selectedBed.bed.student?.name ?? "Assigned student"}
                      </Text>
                      {!!selectedBed.bed.student?.address && (
                        <Text style={styles.subtitle}>
                          {selectedBed.bed.student.address}
                        </Text>
                      )}
                      {selectedBed.bed.monthlyRent !== null && (
                        <Text style={styles.rent}>
                          ₹
                          {Number(selectedBed.bed.monthlyRent).toLocaleString(
                            "en-IN"
                          )}{" "}
                          / month
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      <Text style={styles.subtitle}>
                        Use the student's dashboard code to link their account.
                      </Text>
                      <TextInput
                        mode="outlined"
                        label="Student unique code"
                        value={studentCode}
                        onChangeText={(value) => {
                          setStudentCode(value.toUpperCase());
                          setMatchedStudent(null);
                          setFormError(null);
                        }}
                        autoCapitalize="characters"
                        maxLength={10}
                        disabled={lookingUp || saving}
                        testID="bed-student-code"
                      />
                      <Button
                        mode="outlined"
                        loading={lookingUp}
                        disabled={lookingUp || saving}
                        onPress={() => void lookupStudent()}
                        testID="lookup-student-code"
                      >
                        Find student
                      </Button>

                      {matchedStudent && (
                        <>
                          <Text style={styles.matchedStudentLabel}>
                            ACCOUNT MATCHED
                          </Text>
                          <Text style={styles.cardTitle}>
                            {matchedStudent.name}
                          </Text>
                          <Text style={styles.subtitle}>
                            {matchedStudent.email}
                          </Text>
                          {matchedStudent.currentAssignment && (
                            <Text style={styles.transferNotice}>
                              {matchedStudent.currentAssignment.isCurrentPG
                                ? `Already assigned to bed ${matchedStudent.currentAssignment.bedNumber ?? ""} in this PG.`
                                : `Currently assigned to ${matchedStudent.currentAssignment.pgName}${matchedStudent.currentAssignment.bedNumber ? `, bed ${matchedStudent.currentAssignment.bedNumber}` : ""}. Assigning here will transfer the student and release the old bed.`}
                            </Text>
                          )}
                          <TextInput
                            mode="outlined"
                            label="Student address"
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            disabled={saving}
                            testID="bed-student-address"
                          />
                          <TextInput
                            mode="outlined"
                            label="Monthly rent (₹)"
                            value={monthlyRent}
                            onChangeText={setMonthlyRent}
                            keyboardType="number-pad"
                            disabled={saving}
                            testID="bed-monthly-rent"
                          />
                        </>
                      )}
                    </>
                  )}
                </ScrollView>
                {!selectedBed.bed.occupied && formError && (
                  <View style={styles.modalErrorContainer}>
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {formError}
                    </Text>
                  </View>
                )}
                <View style={styles.modalActions}>
                  {selectedBed.bed.occupied ? (
                    <Button
                      mode="outlined"
                      style={styles.modalActionButton}
                      contentStyle={styles.modalActionContent}
                      onPress={closeBed}
                    >
                      Close
                    </Button>
                  ) : (
                    <>
                      <Button
                        mode="outlined"
                        style={styles.modalActionButton}
                        contentStyle={styles.modalActionContent}
                        disabled={saving || lookingUp}
                        onPress={closeBed}
                      >
                        Cancel
                      </Button>
                      <Button
                        mode="contained"
                        style={styles.modalActionButton}
                        contentStyle={styles.modalActionContent}
                        loading={saving}
                        disabled={
                          !matchedStudent ||
                          matchedStudent.currentAssignment?.isCurrentPG ===
                            true ||
                          saving ||
                          lookingUp
                        }
                        onPress={() => void assignStudent()}
                        testID="assign-student-to-bed"
                      >
                        Assign bed
                      </Button>
                    </>
                  )}
                </View>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

const RoomCard = ({
  room,
  onSelectBed,
}: {
  room: Room;
  onSelectBed: (room: Room, bed: Bed) => void;
}) => {
  const beds = getBeds(room);
  const occupied = getOccupiedCount(room);
  const occupancyPercent = room.capacity
    ? Math.min(100, Math.round((occupied / room.capacity) * 100))
    : 0;

  return (
    <View style={styles.roomCard}>
      <View style={styles.roomHeader}>
        <View style={styles.roomNumber}>
          <Text style={styles.roomNumberText}>{room.roomNumber}</Text>
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.cardTitle}>Room {room.roomNumber}</Text>
          <Text style={styles.subtitle}>
            {getFloorLabel(room.floor)} · {room.capacity} beds
          </Text>
        </View>
        <Text style={styles.roomStatus}>{occupied}/{room.capacity}</Text>
      </View>

      <View style={styles.bedGrid}>
        {beds.map((bed) => (
          <Pressable
            key={bed.bedNumber}
            accessibilityRole="button"
            accessibilityLabel={`Bed ${bed.bedNumber}${bed.occupied ? ", occupied" : ", available"}`}
            onPress={() => onSelectBed(room, bed)}
            style={[
              styles.bedBox,
              bed.occupied ? styles.bedBoxOccupied : styles.bedBoxAvailable,
            ]}
            testID={`bed-${bed.bedNumber}`}
          >
            <Text
              style={[
                styles.bedNumber,
                bed.occupied && styles.bedNumberOccupied,
              ]}
            >
              {bed.bedNumber}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${occupancyPercent}%` }]} />
      </View>
      <Text style={styles.subtitle}>
        {occupied} of {room.capacity} beds occupied
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  eyebrow: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
  },
  title: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  search: {
    backgroundColor: COLORS.surface,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  filterTextActive: {
    color: COLORS.surface,
  },
  summaryCard: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLow,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  vacantBadge: {
    color: COLORS.secondary,
    backgroundColor: COLORS.secondarySoft,
    overflow: "hidden",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  roomCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 10,
  },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roomNumber: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  roomNumberText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  roomInfo: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  roomStatus: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  bedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bedBox: {
    minWidth: 58,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
  },
  bedBoxAvailable: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  bedBoxOccupied: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondarySoft,
  },
  bedNumber: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  bedNumberOccupied: {
    color: COLORS.secondary,
  },
  rent: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  progressTrack: {
    height: 6,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: COLORS.surfaceHigh,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 10,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "rgba(12, 24, 32, 0.55)",
  },
  modalKeyboard: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
  },
  modalCard: {
    width: "100%",
    maxHeight: "92%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  modalContent: {
    padding: 20,
    gap: 12,
  },
  modalErrorContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalTitle: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  matchedStudentLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  transferNotice: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primarySoft,
    color: COLORS.primary,
    fontSize: 12,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalActionButton: {
    flex: 1,
  },
  modalActionContent: {
    minHeight: 44,
  },
});
