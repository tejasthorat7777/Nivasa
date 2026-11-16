import * as React from "react";
import { View, Text, ScrollView, Button, StyleSheet, ActivityIndicator, ErrorBoundary } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/auth.store";
import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { endpoints } from "../../services/api";

export const LandlordDashboard = () => {
  const { user, pgId, role } = useAuthStore.getState();
  const [tabs, setTabs] = useState<"home" | "rooms" | "students" | "finance" | "profile">("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<{
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    monthlyRevenue: number;
    rentCollected: number;
    pendingRent: number;
    monthlyExpenses: number;
    netIncome: number;
  }>({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    monthlyRevenue: 0,
    rentCollected: 0,
    pendingRent: 0,
    monthlyExpenses: 0,
    netIncome: 0,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch landlord dashboard data from backend API
        const response = await api.get(endpoints.dashboard.landlord);

        if (response.data) {
          setStats({
            totalRooms: response.data.dashboard.occupancy.totalRooms,
            occupiedRooms: response.data.dashboard.occupancy.occupiedRooms,
            availableRooms: response.data.dashboard.occupancy.availableRooms,
            monthlyRevenue: response.data.dashboard.revenue.rentCollected,
            rentCollected: response.data.dashboard.revenue.rentCollected,
            pendingRent: response.data.dashboard.revenue.pendingRent,
            monthlyExpenses: response.data.dashboard.revenue.monthlyExpenses,
            netIncome: response.data.dashboard.revenue.netIncome,
          });
        }
      } catch (err: any) {
        console.error("Failed to load landlord dashboard:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [pgId]);

  const handleTabChange = (tab: string) => {
    setTabs(tab);
  };

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
        {/* Header with user info and stats */}
        <View style={styles.header}>
          <Text style={styles.welcome}>Welcome, {user?.name}</Text>
          <Text style={styles.pgName}>PG: {user?.pgId ? "StayNest Student Living" : ""}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalRooms}</Text>
            <Text style={styles.statLabel}>Total Rooms</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.occupiedRooms}</Text>
            <Text style={styles.statLabel}>Occupied</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.availableRooms}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{stats.monthlyRevenue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Monthly Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{stats.pendingRent.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Pending Rent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{stats.monthlyExpenses.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Monthly Expenses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{stats.netIncome.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Net Income</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons} marginTop={24}>
          <Button mode="contained" onPress={() => setTabs("rooms")}>
            <Text>{"Rooms"}</Text>
          </Button>
          <Button mode="contained" onPress={() => setTabs("students")}>
            <Text>{"Students"}</Text>
          </Button>
          <Button mode="contained" onPress={() => setTabs("finance")}>
            <Text>{"Finance"}</Text>
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