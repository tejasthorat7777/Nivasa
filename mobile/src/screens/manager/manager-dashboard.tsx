import * as React from "react";
import { View, Text, ScrollView, Button, StyleSheet, ActivityIndicator, ErrorBoundary } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/auth.store";
import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { endpoints } from "../../services/api";

export const ManagerDashboard = () => {
  const { user, pgId, role } = useAuthStore.getState();
  const [tabs, setTabs] = useState<"home" | "complaints" | "equipment" | "tasks" | "profile">("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<{
    openComplaints: number;
    pendingMaintenance: number;
    equipmentFailures: number;
    completedTasks: number;
  }>({
    openComplaints: 0,
    pendingMaintenance: 0,
    equipmentFailures: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch manager dashboard data from backend API
        const response = await api.get(endpoints.dashboard.manager);

        if (response.data) {
          setStats({
            openComplaints: response.data.openComplaints,
            pendingMaintenance: response.data.pendingMaintenance,
            equipmentFailures: response.data.equipmentFailures,
            completedTasks: response.data.completedTasks,
          });
        }
      } catch (err: any) {
        console.error("Failed to load manager dashboard:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [pgId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading dashboard data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Error: {error}</Text>
        <Button mode="contained" onPress={() => {} }>Retry</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcome}>Welcome, {user?.name}</Text>
          <Text style={styles.pgName}>PG: {user?.pgId ? "StayNest Student Living" : ""}</Text>
        </View>

        <View style={statsGrid}>
          <View style={statCard}>
            <Text style={statValue}>{stats.openComplaints}</Text>
            <Text style={statLabel}>Open Complaints</Text>
          </View>
          <View style={statCard}>
            <Text style={statValue}>{stats.pendingMaintenance}</Text>
            <Text style={statLabel}>Pending Maintenance</Text>
          </View>
          <View style={statCard}>
            <Text style={statValue}>{stats.equipmentFailures}</Text>
            <Text style={statLabel}>Equipment Issues</Text>
          </View>
          <View style={statCard}>
            <Text style={statValue}>{stats.completedTasks}</Text>
            <Text style={statLabel}>Completed Tasks</Text>
          </View>
        </View>

        <View style={styles.actionButtons} marginTop={24}>
          <Button mode="contained" onPress={() => setTabs("complaints")}>
            <Text>{"Complaints"}</Text>
          </Button>
          <Button mode="contained" onPress={() => setTabs("equipment")}>
            <Text>{"Equipment"}</Text>
          </Button>
          <Button mode="contained" onPress={() => setTabs("tasks")}>
            <Text>{"Tasks"}</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  welcome: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
  },
  pgName: {
    color: "#6B7280",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "uppercase",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  error: {
    color: "#DC3545",
    margin: 16,
    fontSize: 16,
  },
});