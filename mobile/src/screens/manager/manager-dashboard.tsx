import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppHeader } from "../../components/common/AppHeader";
import { FeatureEmptyState } from "../../components/common/FeatureEmptyState";
import { RoomInventory } from "../../components/common/RoomInventory";
import { useAuthStore } from "../../store/auth.store";
import api, { endpoints } from "../../services/api";
import { COLORS } from "../../theme";

interface ManagerStats {
  openComplaints: number;
  pendingMaintenance: number;
  equipmentFailures: number;
  completedTasks: number;
}

type ManagerTab = "operations" | "maintenance" | "cleaning" | "staff";

export const ManagerDashboard = ({
  onProfilePress,
}: {
  onProfilePress?: () => void;
}) => {
  const { user, pgId } = useAuthStore.getState();
  const [tab, setTab] = React.useState<ManagerTab>("operations");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<ManagerStats>({
    openComplaints: 0,
    pendingMaintenance: 0,
    equipmentFailures: 0,
    completedTasks: 0,
  });

  React.useEffect(() => {
    let active = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(endpoints.dashboard.manager);
        if (active && response.data?.dashboard) {
          setStats(response.data.dashboard);
        }
      } catch (requestError: unknown) {
        if (!active) return;
        console.error("Failed to load manager dashboard:", requestError);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load dashboard data"
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadDashboardData();
    return () => {
      active = false;
    };
  }, [pgId]);

  return (
    <View style={styles.container}>
      <ScrollView
        testID="manager-dashboard-scroll-view"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader
          name={user?.name}
          role="Manager"
          onProfilePress={onProfilePress}
        />
        {loading && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.subtitle}>Updating operations...</Text>
          </View>
        )}
        {error && <Text style={styles.error}>{error}</Text>}

        {tab === "operations" && (
          <>
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>MANAGER WORKSPACE</Text>
              <Text style={styles.title}>Rooms & Beds</Text>
              <Text style={styles.subtitle}>
                Keep your PG inventory and daily operations in view.
              </Text>
            </View>
            <View style={styles.statsGrid}>
              <SummaryCard label="Open complaints" value={stats.openComplaints} accent="orange" />
              <SummaryCard label="Pending maintenance" value={stats.pendingMaintenance} />
              <SummaryCard label="Equipment issues" value={stats.equipmentFailures} accent="orange" />
              <SummaryCard label="Tasks completed" value={stats.completedTasks} />
            </View>
            <RoomInventory />
          </>
        )}

        {tab === "maintenance" && (
          <View style={styles.tabContent} testID="manager-maintenance-content">
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>MAINTENANCE DESK</Text>
              <Text style={styles.title}>Maintenance requests</Text>
              <Text style={styles.subtitle}>
                Track open maintenance work for your property.
              </Text>
            </View>
            <View style={styles.filterRow}>
              {["All", "Urgent", "In progress", "Resolved"].map((filter) => (
                <Text key={filter} style={styles.filterChip}>
                  {filter}
                </Text>
              ))}
            </View>
            <SummaryCard label="Pending maintenance" value={stats.pendingMaintenance} accent="orange" />
            <FeatureEmptyState
              icon="⌕"
              title="Request details are unavailable"
              message="The dashboard provides a pending count, but maintenance ticket details are not connected yet."
            />
          </View>
        )}

        {tab === "cleaning" && (
          <View style={styles.tabContent} testID="manager-cleaning-content">
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>HOUSEKEEPING DESK</Text>
              <Text style={styles.title}>Cleaning & hygiene</Text>
              <Text style={styles.subtitle}>
                Review housekeeping progress across the PG.
              </Text>
            </View>
            <View style={styles.filterRow}>
              {["Ground floor", "1st floor", "2nd floor", "3rd floor"].map((floor) => (
                <Text key={floor} style={styles.filterChip}>
                  {floor}
                </Text>
              ))}
            </View>
            <SummaryCard label="Tasks completed" value={stats.completedTasks} />
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>COMMON AREAS</Text>
              <Text style={styles.subtitle}>No inspection schedule available</Text>
            </View>
            <FeatureEmptyState
              icon="✦"
              title="No task roster available"
              message="The current backend does not provide room cleaning schedules or housekeeping assignments."
            />
          </View>
        )}

        {tab === "staff" && (
          <View style={styles.tabContent} testID="manager-staff-content">
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>STAFF & VENDORS</Text>
              <Text style={styles.title}>Team desk</Text>
              <Text style={styles.subtitle}>
                Manage on-call contractors and facility staff.
              </Text>
            </View>
            <View style={styles.filterRow}>
              {["All", "Maintenance", "Housekeeping", "Security"].map((team) => (
                <Text key={team} style={styles.filterChip}>
                  {team}
                </Text>
              ))}
            </View>
            <FeatureEmptyState
              icon="♙"
              title="Staff roster is not connected"
              message="Staff and vendor profiles are not available in the current backend."
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <ManagerNavItem
          testID="manager-tab-operations"
          label="Operations"
          icon="✓"
          active={tab === "operations"}
          onPress={() => setTab("operations")}
        />
        <ManagerNavItem
          testID="manager-tab-maintenance"
          label="Maintenance"
          icon="⌕"
          active={tab === "maintenance"}
          onPress={() => setTab("maintenance")}
        />
        <ManagerNavItem
          testID="manager-tab-cleaning"
          label="Cleaning"
          icon="✦"
          active={tab === "cleaning"}
          onPress={() => setTab("cleaning")}
        />
        <ManagerNavItem
          testID="manager-tab-staff"
          label="Staff"
          icon="♙"
          active={tab === "staff"}
          onPress={() => setTab("staff")}
        />
      </View>
    </View>
  );
};

const ManagerNavItem = ({
  testID,
  label,
  icon,
  active,
  onPress,
}: {
  testID: string;
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    testID={testID}
    style={[styles.navItem, active && styles.navItemActive]}
    onPress={onPress}
  >
    <Text style={[styles.navIcon, active && styles.navTextActive]}>{icon}</Text>
    <Text style={[styles.navLabel, active && styles.navTextActive]}>{label}</Text>
  </Pressable>
);

const SummaryCard = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "orange";
}) => (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryLabel}>{label.toUpperCase()}</Text>
    <Text style={[styles.summaryValue, accent === "orange" && styles.accentValue]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 16,
    gap: 18,
  },
  tabContent: {
    gap: 16,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLow,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  intro: {
    gap: 5,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryCard: {
    width: "48%",
    minHeight: 92,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  summaryValue: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "800",
  },
  accentValue: {
    color: COLORS.secondary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  error: {
    color: COLORS.danger,
    fontSize: 13,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navItem: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    gap: 2,
  },
  navItemActive: {
    backgroundColor: COLORS.primarySoft,
  },
  navIcon: {
    color: COLORS.muted,
    fontSize: 18,
    fontWeight: "700",
  },
  navLabel: {
    color: COLORS.muted,
    fontSize: 10,
  },
  navTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
