import * as React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Button,
  Switch,
} from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BrandLogo } from "../../components/common/BrandLogo";
import type { RootStackParamList } from "../../navigation.types";
import api, { endpoints } from "../../services/api";
import { COLORS } from "../../theme";

type BuildingSetupScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "BuildingSetup"
>;
type PurifierPlacement = "COMMON" | "PER_FLOOR";
type MealService = "BREAKFAST" | "LUNCH" | "DINNER";
type Amenity =
  | "WIFI"
  | "LAUNDRY"
  | "PARKING"
  | "CCTV"
  | "SECURITY"
  | "POWER_BACKUP"
  | "COMMON_AREA"
  | "KITCHEN"
  | "DINING_AREA"
  | "HOUSEKEEPING"
  | "ELEVATOR"
  | "FIRE_SAFETY"
  | "AIR_CONDITIONING"
  | "FAN";

interface RoomLayout {
  roomNumber: string;
  beds: number;
  privateBathroom: boolean;
}

interface FloorLayout {
  floorNumber: number;
  sharedBathrooms: number;
  rooms: RoomLayout[];
}

interface BuildingSetup {
  floors: FloorLayout[];
  waterPurifier: {
    available: boolean;
    placement: PurifierPlacement;
    count: number;
  };
  mess: {
    available: boolean;
    meals: MealService[];
  };
  amenities: Amenity[];
}

const amenityOptions: { key: Amenity; label: string }[] = [
  { key: "WIFI", label: "Wi-Fi" },
  { key: "LAUNDRY", label: "Laundry" },
  { key: "PARKING", label: "Parking" },
  { key: "CCTV", label: "CCTV" },
  { key: "SECURITY", label: "Security guard" },
  { key: "POWER_BACKUP", label: "Power backup" },
  { key: "COMMON_AREA", label: "Common lounge" },
  { key: "KITCHEN", label: "Kitchen access" },
  { key: "DINING_AREA", label: "Dining area" },
  { key: "HOUSEKEEPING", label: "Housekeeping" },
  { key: "ELEVATOR", label: "Elevator" },
  { key: "FIRE_SAFETY", label: "Fire safety equipment" },
  { key: "AIR_CONDITIONING", label: "Air conditioning" },
  { key: "FAN", label: "Fan" },
];

const mealOptions: { key: MealService; label: string }[] = [
  { key: "BREAKFAST", label: "Breakfast" },
  { key: "LUNCH", label: "Lunch" },
  { key: "DINNER", label: "Dinner" },
];

const roomNumberFor = (floorNumber: number, roomIndex: number) =>
  `${floorNumber === 0 ? "G" : floorNumber}-${String(roomIndex + 1).padStart(2, "0")}`;

const createRoom = (floorNumber: number, roomIndex: number): RoomLayout => ({
  roomNumber: roomNumberFor(floorNumber, roomIndex),
  beds: 1,
  privateBathroom: false,
});

const createFloor = (floorNumber: number): FloorLayout => ({
  floorNumber,
  sharedBathrooms: 1,
  rooms: [createRoom(floorNumber, 0)],
});

const initialSetup = (): BuildingSetup => ({
  floors: [createFloor(0)],
  waterPurifier: {
    available: false,
    placement: "COMMON",
    count: 0,
  },
  mess: {
    available: false,
    meals: [],
  },
  amenities: [],
});

const floorLabel = (floorNumber: number) =>
  floorNumber === 0 ? "Ground floor" : `Floor ${floorNumber}`;

export const BuildingSetupScreen = ({
  navigation,
  route,
}: BuildingSetupScreenProps) => {
  const isOnboarding = route.params?.onboarding ?? false;
  const [setup, setSetup] = React.useState<BuildingSetup>(initialSetup);
  const [pgName, setPgName] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;

    api
      .get(endpoints.pg.myPG)
      .then(({ data }) => {
        if (!data.pg) {
          throw new Error("The server did not return this PG's details.");
        }
        if (!active) return;

        setPgName(data.pg.name ?? "");
        const existing = data.pg.buildingSetup as BuildingSetup | undefined;
        if (existing?.floors?.length) {
          setSetup({
            floors: existing.floors.map((floor) => ({
              floorNumber: floor.floorNumber,
              sharedBathrooms: floor.sharedBathrooms,
              rooms: floor.rooms.map((room) => ({ ...room })),
            })),
            waterPurifier: {
              available: existing.waterPurifier?.available ?? false,
              placement: existing.waterPurifier?.placement ?? "COMMON",
              count: existing.waterPurifier?.count ?? 0,
            },
            mess: {
              available: existing.mess?.available ?? false,
              meals: existing.mess?.meals ?? [],
            },
            amenities: existing.amenities ?? [],
          });
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load your PG details."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const changeFloorCount = (count: number) => {
    setSetup((current) => ({
      ...current,
      floors: Array.from({ length: count }, (_, index) => {
        const floorNumber = index;
        const existing = current.floors[index];
        if (!existing) return createFloor(floorNumber);
        return {
          ...existing,
          floorNumber,
          rooms: existing.rooms.map((room, roomIndex) => ({
            ...room,
            roomNumber: roomNumberFor(floorNumber, roomIndex),
          })),
        };
      }),
    }));
    setError("");
  };

  const changeRoomCount = (floorIndex: number, count: number) => {
    setSetup((current) => ({
      ...current,
      floors: current.floors.map((floor, index) => {
        if (index !== floorIndex) return floor;
        return {
          ...floor,
          rooms: Array.from({ length: count }, (_, roomIndex) => ({
            ...(floor.rooms[roomIndex] ?? createRoom(floor.floorNumber, roomIndex)),
            roomNumber: roomNumberFor(floor.floorNumber, roomIndex),
          })),
        };
      }),
    }));
    setError("");
  };

  const updateFloor = (
    floorIndex: number,
    updates: Partial<FloorLayout>
  ) => {
    setSetup((current) => ({
      ...current,
      floors: current.floors.map((floor, index) =>
        index === floorIndex ? { ...floor, ...updates } : floor
      ),
    }));
  };

  const updateRoom = (
    floorIndex: number,
    roomIndex: number,
    updates: Partial<RoomLayout>
  ) => {
    setSetup((current) => ({
      ...current,
      floors: current.floors.map((floor, currentFloorIndex) =>
        currentFloorIndex !== floorIndex
          ? floor
          : {
              ...floor,
              rooms: floor.rooms.map((room, currentRoomIndex) =>
                currentRoomIndex === roomIndex
                  ? { ...room, ...updates }
                  : room
              ),
            }
      ),
    }));
    setError("");
  };

  const toggleAmenity = (amenity: Amenity) => {
    setSetup((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  const toggleMeal = (meal: MealService) => {
    setSetup((current) => ({
      ...current,
      mess: {
        ...current.mess,
        meals: current.mess.meals.includes(meal)
          ? current.mess.meals.filter((item) => item !== meal)
          : [...current.mess.meals, meal],
      },
    }));
  };

  const saveSetup = async () => {
    const totalRooms = setup.floors.reduce(
      (total, floor) => total + floor.rooms.length,
      0
    );
    if (totalRooms > 500) {
      setError("A building can have at most 500 rooms.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const { data } = await api.patch(
        endpoints.pg.buildingSetup,
        setup
      );
      if (!data.success) {
        throw new Error(data.message || "Unable to save the building setup.");
      }
      navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard" }],
      });
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save the building setup."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        testID="building-setup-scroll-view"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
        {!isOnboarding && (
          <Button
            mode="text"
            contentStyle={styles.backButtonContent}
            onPress={() => navigation.goBack()}
          >
            Back
          </Button>
        )}
        <BrandLogo width={164} height={55} style={styles.brandMark} />
        <Text style={styles.eyebrow}>PROPERTY SETUP</Text>
        <Text style={styles.title}>Set up your building</Text>
        <Text style={styles.subtitle}>
          {pgName ? `${pgName} · ` : ""}
          Add the layout and facilities you currently offer. You can update
          these details later.
        </Text>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.helperText}>Loading PG details...</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Building layout</Text>
          <Text style={styles.helperText}>
            Set the floor and room counts first, then add bed and bathroom
            details for each room.
          </Text>
          <NumberStepper
            label="Floors, including ground floor"
            value={setup.floors.length}
            min={1}
            max={30}
            onChange={changeFloorCount}
            disabled={loading || saving}
            testID="building-floor-count"
          />

          {setup.floors.map((floor, floorIndex) => (
            <View key={floor.floorNumber} style={styles.floorCard}>
              <Text style={styles.floorTitle}>
                {floorLabel(floor.floorNumber)}
              </Text>
              <NumberStepper
                label="Rooms on this floor"
                value={floor.rooms.length}
                min={1}
                max={100}
                onChange={(count) => changeRoomCount(floorIndex, count)}
                disabled={loading || saving}
                testID={`floor-${floor.floorNumber}-room-count`}
              />
              <NumberStepper
                label="Shared bathrooms on this floor"
                value={floor.sharedBathrooms}
                min={0}
                max={100}
                onChange={(sharedBathrooms) =>
                  updateFloor(floorIndex, { sharedBathrooms })
                }
                disabled={loading || saving}
                testID={`floor-${floor.floorNumber}-bathroom-count`}
              />

              {floor.rooms.map((room, roomIndex) => (
                <View
                  key={room.roomNumber}
                  style={styles.roomCard}
                  testID={`building-room-${room.roomNumber}`}
                >
                  <Text style={styles.roomTitle}>Room {room.roomNumber}</Text>
                  <NumberStepper
                    label="Beds"
                    value={room.beds}
                    min={1}
                    max={20}
                    onChange={(beds) =>
                      updateRoom(floorIndex, roomIndex, { beds })
                    }
                    disabled={loading || saving}
                    testID={`room-${room.roomNumber}-beds`}
                  />
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Private bathroom</Text>
                    <Switch
                      disabled={loading || saving}
                      value={room.privateBathroom}
                      onValueChange={(privateBathroom) =>
                        updateRoom(floorIndex, roomIndex, { privateBathroom })
                      }
                      testID={`room-${room.roomNumber}-private-bathroom`}
                    />
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Water and meals</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchLabel}>Water purifier available</Text>
              <Text style={styles.helperText}>
                Record whether purifiers are shared or installed on every floor.
              </Text>
            </View>
            <Switch
              disabled={loading || saving}
              value={setup.waterPurifier.available}
              onValueChange={(available) =>
                setSetup((current) => ({
                  ...current,
                  waterPurifier: {
                    ...current.waterPurifier,
                    available,
                    count: available ? Math.max(1, current.waterPurifier.count) : 0,
                  },
                }))
              }
              testID="water-purifier-switch"
            />
          </View>
          {setup.waterPurifier.available && (
            <>
              <RadioOption
                label="In common area"
                selected={setup.waterPurifier.placement === "COMMON"}
                onPress={() =>
                  setSetup((current) => ({
                    ...current,
                    waterPurifier: {
                      ...current.waterPurifier,
                      placement: "COMMON",
                    },
                  }))
                }
              />
              <RadioOption
                label="On each floor"
                selected={setup.waterPurifier.placement === "PER_FLOOR"}
                onPress={() =>
                  setSetup((current) => ({
                    ...current,
                    waterPurifier: {
                      ...current.waterPurifier,
                      placement: "PER_FLOOR",
                    },
                  }))
                }
              />
              <NumberStepper
                label={
                  setup.waterPurifier.placement === "PER_FLOOR"
                    ? "Purifiers on each floor"
                    : "Purifiers in common areas"
                }
                value={setup.waterPurifier.count}
                min={1}
                max={100}
                onChange={(count) =>
                  setSetup((current) => ({
                    ...current,
                    waterPurifier: { ...current.waterPurifier, count },
                  }))
                }
                disabled={loading || saving}
                testID="water-purifier-count"
              />
            </>
          )}

          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchLabel}>Mess / meals available</Text>
              <Text style={styles.helperText}>
                Select the meals typically provided by your PG.
              </Text>
            </View>
            <Switch
              disabled={loading || saving}
              value={setup.mess.available}
              onValueChange={(available) =>
                setSetup((current) => ({
                  ...current,
                  mess: {
                    ...current.mess,
                    available,
                    meals: available ? current.mess.meals : [],
                  },
                }))
              }
              testID="mess-available-switch"
            />
          </View>
          {setup.mess.available &&
            mealOptions.map((meal) => (
              <CheckboxOption
                key={meal.key}
                label={meal.label}
                checked={setup.mess.meals.includes(meal.key)}
                onPress={() => toggleMeal(meal.key)}
                disabled={loading || saving}
              />
            ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other facilities</Text>
          <Text style={styles.helperText}>
            These details can power resident information, operations, and future
            amenity filters.
          </Text>
          <View style={styles.amenityGrid}>
            {amenityOptions.map((amenity) => (
              <CheckboxOption
                key={amenity.key}
                label={amenity.label}
                checked={setup.amenities.includes(amenity.key)}
                onPress={() => toggleAmenity(amenity.key)}
                disabled={loading || saving}
              />
            ))}
          </View>
        </View>

        {!!error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
        <Button
          mode="contained"
          loading={saving}
          disabled={loading || saving}
          onPress={() => void saveSetup()}
          style={styles.saveButton}
          testID="save-building-setup"
        >
          Save building setup
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const NumberStepper = ({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
  testID,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled: boolean;
  testID: string;
}) => (
  <View style={styles.stepperRow}>
    <Text style={styles.stepperLabel}>{label}</Text>
    <View style={styles.stepperControl}>
      <Pressable
        accessibilityLabel={`Decrease ${label}`}
        accessibilityRole="button"
        disabled={disabled || value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.stepperButton, (disabled || value <= min) && styles.stepperDisabled]}
        testID={`${testID}-decrease`}
      >
        <Text style={styles.stepperButtonText}>−</Text>
      </Pressable>
      <Text style={styles.stepperValue} testID={`${testID}-value`}>
        {value}
      </Text>
      <Pressable
        accessibilityLabel={`Increase ${label}`}
        accessibilityRole="button"
        disabled={disabled || value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.stepperButton, (disabled || value >= max) && styles.stepperDisabled]}
        testID={`${testID}-increase`}
      >
        <Text style={styles.stepperButtonText}>+</Text>
      </Pressable>
    </View>
  </View>
);

const RadioOption = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="radio"
    accessibilityState={{ checked: selected }}
    onPress={onPress}
    style={styles.optionRow}
  >
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioDot} />}
    </View>
    <Text style={styles.optionLabel}>{label}</Text>
  </Pressable>
);

const CheckboxOption = ({
  label,
  checked,
  onPress,
  disabled,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  disabled: boolean;
}) => (
  <Pressable
    accessibilityRole="checkbox"
    accessibilityState={{ checked, disabled }}
    disabled={disabled}
    onPress={onPress}
    style={styles.optionRow}
  >
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkboxCheck}>✓</Text>}
    </View>
    <Text style={styles.optionLabel}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  backButtonContent: {
    alignSelf: "flex-start",
    paddingHorizontal: 0,
  },
  brandMark: {
    marginTop: 16,
    marginBottom: 16,
  },
  eyebrow: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  title: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 18,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  section: {
    padding: 16,
    marginBottom: 16,
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 42,
  },
  stepperLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
  },
  stepperControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepperButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primarySoft,
    borderRadius: 17,
  },
  stepperDisabled: {
    opacity: 0.4,
  },
  stepperButtonText: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "700",
  },
  stepperValue: {
    minWidth: 24,
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  floorCard: {
    padding: 12,
    gap: 10,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 10,
  },
  floorTitle: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  roomCard: {
    padding: 10,
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  roomTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  switchCopy: {
    flex: 1,
  },
  switchLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: COLORS.muted,
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxCheck: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 18,
  },
  radio: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: COLORS.muted,
    borderRadius: 11,
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  optionLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
  },
  amenityGrid: {
    gap: 2,
  },
  error: {
    color: COLORS.danger,
    fontSize: 13,
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 2,
  },
});
