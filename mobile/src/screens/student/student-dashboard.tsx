import * as React from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/auth.store";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { endpoints } from "../../services/api";

export const StudentDashboard = () => {
  const { user, pgId, role } = useAuthStore.getState();
  const [tabs, setTabs] = useState<"home" | "bills" | "complaints" | "notices" | "profile">("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<{
    currentBill: any;
    roomInfo: any;
    announcements: any[];
  }>({
    currentBill: null,
    roomInfo: null,
    announcements: [],
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch student dashboard data from backend API
        const response = await api.get(endpoints.dashboard.student);

        if (response.data) {
          setDashboard({
            currentBill: response.data.currentBill,
            roomInfo: response.data.roomInfo,
            announcements: response.data.announcements,
          });
        }
      } catch (err: any) {
        console.error("Failed to load student dashboard:", err);
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

        {/* Home stats */}
        <View style={styles.homeStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{dashboard.currentBill?.rentAmount || 0}</Text>
            <Text style={styles.statLabel}>Monthly Rent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{dashboard.currentBill?.balanceAmount || 0}</Text>
            <Text style={styles.statLabel}>Outstanding</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Due: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })}</Text>
            <Text style={styles.statLabel}>Next Payment</Text>
          </View>
        </View>

        {dashboard.roomInfo && (
          <View style={{ marginTop: 16, padding: 16, backgroundColor: "#FFFFFF", borderRadius: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#1F2937" }}>Room Details</Text>
            <Text style={{ fontSize: 14, color: "#6B7280" }}>Room: {dashboard.roomInfo?.roomNumber}</Text>
            <Text style={{ fontSize: 14, color: "#6B7280" }}>Floor: {dashboard.roomInfo?.floor}</Text>
            <Text style={{ fontSize: 14, color: "#6B7280" }}>Type: {dashboard.roomInfo?.sharingType}</Text>
          </View>
        )}

        <View style={styles.actionButtons} marginTop={24}>
          <Button mode="contained" onPress={() => setTabs("bills")}>
            <Text>{"Bills"}</Text>
          </Button>
          <Button mode="contained" onPress={() => setTabs("complaints")}>
            <Text>{"Complaints"}</Text>
          </Button>
          <Button mode="contained" onPress={() => setTabs("notices")}>
            <Text>{"Notices"}</Text>
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
  homeStats: {
    marginBottom: 24,
  },
  statItem: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
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