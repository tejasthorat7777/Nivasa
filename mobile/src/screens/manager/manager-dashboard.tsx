import * as React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppHeader } from "../../components/common/AppHeader";
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

export const ManagerDashboard = () => {
  const { user, pgId } = useAuthStore.getState();
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
        <AppHeader name={user?.name} role="Manager" />
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

        {loading && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.subtitle}>Updating operations...</Text>
          </View>
        )}
        {error && <Text style={styles.error}>{error}</Text>}

        <RoomInventory />
      </ScrollView>
    </View>
  );
};

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
    paddingBottom: 32,
    gap: 18,
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
});
