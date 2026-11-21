import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import api, { endpoints } from "../../services/api";
import { COLORS } from "../../theme";

type RoomFilter = "ALL" | "AVAILABLE" | "PARTIAL" | "FULL";

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
}

const filters: RoomFilter[] = ["ALL", "AVAILABLE", "PARTIAL", "FULL"];

export const RoomInventory = () => {
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<RoomFilter>("ALL");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retry, setRetry] = React.useState(0);

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
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load rooms"
        );
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
    const occupied = room.occupiedBeds ?? 0;
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
        ...(room.facilities ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesFilter && matchesQuery;
  });

  const capacity = rooms.reduce((total, room) => total + (room.capacity || 0), 0);
  const occupied = rooms.reduce(
    (total, room) => total + (room.occupiedBeds || 0),
    0
  );
  const available = Math.max(0, capacity - occupied);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>LIVE INVENTORY</Text>
      <Text style={styles.title}>Rooms & Beds</Text>
      <Text style={styles.subtitle}>Manage room availability and occupancy.</Text>

      <TextInput
        mode="outlined"
        value={query}
        onChangeText={setQuery}
        placeholder="Search room, floor or sharing type"
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
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
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
            {capacity > 0 ? `${Math.round((occupied / capacity) * 100)}% occupancy` : "No room inventory yet"}
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
        visibleRooms.map((room) => <RoomCard key={room._id} room={room} />)
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.cardTitle}>
            {rooms.length ? "No rooms match these filters" : "No rooms added yet"}
          </Text>
          <Text style={styles.subtitle}>
            {rooms.length
              ? "Try a different search or availability filter."
              : "Room inventory will appear here once rooms are added to this PG."}
          </Text>
        </View>
      )}
    </View>
  );
};

const RoomCard = ({ room }: { room: Room }) => {
  const capacity = room.capacity || 0;
  const occupied = room.occupiedBeds || 0;
  const occupancyPercent = capacity
    ? Math.min(100, Math.round((occupied / capacity) * 100))
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
            Floor {room.floor} • {room.sharingType.toLowerCase()} sharing
          </Text>
        </View>
        <Text style={styles.rent}>
          ₹{Number(room.monthlyRent || 0).toLocaleString("en-IN")}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${occupancyPercent}%` }]} />
      </View>
      <View style={styles.roomFooter}>
        <Text style={styles.subtitle}>
          {occupied} of {capacity} beds occupied
        </Text>
        <Text style={styles.roomStatus}>{room.status.replace(/_/g, " ")}</Text>
      </View>
      {!!room.facilities?.length && (
        <Text style={styles.facilities}>{room.facilities.join("  •  ")}</Text>
      )}
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
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  roomNumberText: {
    color: COLORS.surface,
    fontSize: 16,
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
  roomFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roomStatus: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  facilities: {
    color: COLORS.muted,
    fontSize: 11,
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
  },
});
