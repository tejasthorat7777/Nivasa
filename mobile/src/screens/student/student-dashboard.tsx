import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import { AppHeader } from "../../components/common/AppHeader";
import { useAuthStore } from "../../store/auth.store";
import api, { endpoints } from "../../services/api";
import { COLORS } from "../../theme";

type StudentTab = "home" | "bills" | "complaints" | "notices";

interface StudentDashboardData {
  currentBill: any;
  roomInfo: any;
  announcements: any[];
  pg: any;
  student: any;
}

export const StudentDashboard = () => {
  const { user, pgId } = useAuthStore.getState();
  const [tab, setTab] = React.useState<StudentTab>("home");
  const [retry, setRetry] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dashboard, setDashboard] = React.useState<StudentDashboardData>({
    currentBill: null,
    roomInfo: null,
    announcements: [],
    pg: null,
    student: null,
  });

  React.useEffect(() => {
    let active = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(endpoints.dashboard.student);

        if (active && response.data?.dashboard) {
          setDashboard(response.data.dashboard);
        }
      } catch (requestError: unknown) {
        if (!active) return;
        console.error("Failed to load student dashboard:", requestError);
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
  }, [pgId, retry]);

  if (loading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.centeredContent}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.mutedText}>Loading your home...</Text>
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.centeredContent}
      >
        <Text style={styles.errorTitle}>We couldn't load your dashboard</Text>
        <Text style={styles.mutedText}>{error}</Text>
        <Button mode="contained" onPress={() => setRetry((value) => value + 1)}>
          Retry
        </Button>
      </ScrollView>
    );
  }

  const outstanding = dashboard.currentBill?.balanceAmount
    ?? dashboard.currentBill?.totalAmount
    ?? 0;
  const monthlyRent = dashboard.currentBill?.rentAmount ?? 0;
  const announcements = dashboard.announcements ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        testID="student-dashboard-scroll-view"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader
          name={user?.name}
          role="Student"
          propertyName={dashboard.pg?.name || "Nivasa"}
          location={dashboard.pg?.city}
        />

        <View style={styles.welcomeBlock}>
          <Text style={styles.badge}>
            {user?.approvalStatus === "APPROVED"
              ? "●  VERIFIED RESIDENT"
              : "●  REGISTRATION PENDING"}
          </Text>
          <Text style={styles.title}>Hello, {user?.name || "Resident"}!</Text>
          <Text style={styles.mutedText}>
            Welcome to your home at Nivasa. Here's your latest update.
          </Text>
        </View>

        {tab === "home" && (
          <>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.roomIcon}>
                  <Text style={styles.roomIconText}>⌂</Text>
                </View>
                <View style={styles.roomHeading}>
                  <Text style={styles.cardTitle}>
                    {dashboard.roomInfo
                      ? `Room ${dashboard.roomInfo.roomNumber}`
                      : "Room assignment"}
                  </Text>
                  <Text style={styles.mutedSmall}>
                    {dashboard.pg?.name || "Nivasa PG"}
                    {dashboard.roomInfo?.sharingType
                      ? ` • ${dashboard.roomInfo.sharingType} sharing`
                      : ""}
                  </Text>
                </View>
                <Text style={dashboard.roomInfo ? styles.statusActive : styles.statusPending}>
                  {dashboard.roomInfo ? "Active" : "Pending"}
                </Text>
              </View>
              {dashboard.roomInfo ? (
                <View style={styles.detailsGrid}>
                  <View style={styles.detailCell}>
                    <Text style={styles.mutedSmall}>Floor</Text>
                    <Text style={styles.detailValue}>{dashboard.roomInfo.floor}</Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.mutedSmall}>Monthly rent</Text>
                    <Text style={styles.detailValue}>
                      ₹{Number(dashboard.roomInfo.monthlyRent || 0).toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.mutedText}>
                  Room details will appear here after your manager assigns a room.
                </Text>
              )}
            </View>

            <View style={styles.billCard}>
              <Text style={styles.billEyebrow}>CURRENT BILL</Text>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.billAmount}>
                    ₹{Number(outstanding).toLocaleString("en-IN")}
                  </Text>
                  <Text style={styles.billSubtext}>
                    {dashboard.currentBill?.billingMonth || "No bill due"}
                  </Text>
                </View>
                {dashboard.currentBill && (
                  <Text style={styles.dueBadge}>
                    {dashboard.currentBill.status || "UNPAID"}
                  </Text>
                )}
              </View>
              {dashboard.currentBill ? (
                <Text style={styles.billSubtext}>
                  Monthly rent ₹{Number(monthlyRent).toLocaleString("en-IN")}
                  {dashboard.currentBill.dueDate
                    ? ` • Due ${new Date(dashboard.currentBill.dueDate).toLocaleDateString("en-IN")}`
                    : ""}
                </Text>
              ) : (
                <Text style={styles.billSubtext}>
                  Your PG manager has not issued a bill yet.
                </Text>
              )}
              <Button
                mode="contained"
                buttonColor={COLORS.secondary}
                textColor={COLORS.surface}
                onPress={() => setTab("bills")}
              >
                View bills
              </Button>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Student actions</Text>
              <Text style={styles.mutedSmall}>SELF SERVICE</Text>
            </View>
            <View style={styles.actionGrid}>
              <ActionCard
                icon="₹"
                label="Bills"
                detail="Rent and balance"
                onPress={() => setTab("bills")}
              />
              <ActionCard
                icon="!"
                label="Complaints"
                detail="Get help from your PG"
                onPress={() => setTab("complaints")}
              />
              <ActionCard
                icon="▤"
                label="Notices"
                detail="PG announcements"
                onPress={() => setTab("notices")}
              />
              <ActionCard
                icon="⌂"
                label="Room details"
                detail={dashboard.roomInfo ? "View assigned room" : "Assignment pending"}
                onPress={() => setTab("home")}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PG noticeboard</Text>
              <Pressable onPress={() => setTab("notices")}>
                <Text style={styles.linkText}>View all</Text>
              </Pressable>
            </View>
            {announcements.length > 0 ? (
              announcements.map((announcement, index) => (
                <NoticeCard
                  key={announcement._id ?? index}
                  title={announcement.title}
                  message={announcement.message}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.mutedText}>No notices are available yet.</Text>
              </View>
            )}
          </>
        )}

        {tab === "bills" && (
          <View testID="student-bills-content" style={styles.card}>
            <Text style={styles.sectionTitle}>Bills & payments</Text>
            {dashboard.currentBill ? (
              <>
                <BillRow label="Billing period" value={dashboard.currentBill.billingMonth} />
                <BillRow label="Room rent" value={`₹${monthlyRent}`} />
                <BillRow label="Total amount" value={`₹${dashboard.currentBill.totalAmount}`} />
                <BillRow label="Outstanding" value={`₹${outstanding}`} />
                <BillRow label="Status" value={dashboard.currentBill.status} />
                {dashboard.currentBill.dueDate && (
                  <BillRow
                    label="Due date"
                    value={new Date(dashboard.currentBill.dueDate).toLocaleDateString("en-IN")}
                  />
                )}
              </>
            ) : (
              <Text style={styles.mutedText}>No current bill is available.</Text>
            )}
          </View>
        )}

        {tab === "complaints" && (
          <View testID="student-complaints-content" style={styles.card}>
            <Text style={styles.sectionTitle}>Complaints & help</Text>
            <Text style={styles.mutedText}>
              To report an issue, please contact your PG manager.
            </Text>
          </View>
        )}

        {tab === "notices" && (
          <View testID="student-notices-content">
            <Text style={styles.sectionTitle}>Notices</Text>
            {announcements.length > 0 ? (
              announcements.map((announcement, index) => (
                <NoticeCard
                  key={announcement._id ?? index}
                  title={announcement.title}
                  message={announcement.message}
                />
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.mutedText}>No notices are available yet.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem testID="student-tab-home" label="Home" icon="⌂" active={tab === "home"} onPress={() => setTab("home")} />
        <NavItem testID="student-tab-bills" label="Bills" icon="₹" active={tab === "bills"} onPress={() => setTab("bills")} />
        <NavItem testID="student-tab-complaints" label="Complaints" icon="!" active={tab === "complaints"} onPress={() => setTab("complaints")} />
        <NavItem testID="student-tab-notices" label="Notices" icon="▤" active={tab === "notices"} onPress={() => setTab("notices")} />
      </View>
    </View>
  );
};

const ActionCard = ({
  icon,
  label,
  detail,
  onPress,
}: {
  icon: string;
  label: string;
  detail: string;
  onPress: () => void;
}) => (
  <Pressable style={styles.actionCard} onPress={onPress}>
    <View style={styles.actionIcon}>
      <Text style={styles.actionIconText}>{icon}</Text>
    </View>
    <Text style={styles.actionTitle}>{label}</Text>
    <Text style={styles.mutedSmall}>{detail}</Text>
  </Pressable>
);

const BillRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.billRow}>
    <Text style={styles.mutedText}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const NoticeCard = ({ title, message }: { title: string; message: string }) => (
  <View style={styles.noticeCard}>
    <View style={styles.noticeIcon}>
      <Text style={styles.noticeIconText}>!</Text>
    </View>
    <View style={styles.noticeCopy}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.mutedText}>{message}</Text>
    </View>
  </View>
);

const NavItem = ({
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
    style={styles.navItem}
    onPress={onPress}
  >
    <Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text>
    <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 16,
  },
  centeredContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 24,
    backgroundColor: COLORS.background,
  },
  welcomeBlock: {
    gap: 6,
  },
  badge: {
    alignSelf: "flex-start",
    color: COLORS.secondary,
    backgroundColor: COLORS.secondarySoft,
    overflow: "hidden",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  title: {
    color: COLORS.primary,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "700",
  },
  mutedText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  mutedSmall: {
    color: COLORS.outline,
    fontSize: 11,
    lineHeight: 16,
  },
  card: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    gap: 12,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  roomIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  roomIconText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "700",
  },
  roomHeading: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  statusActive: {
    overflow: "hidden",
    backgroundColor: "#DCFCE7",
    color: COLORS.success,
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: "700",
  },
  statusPending: {
    overflow: "hidden",
    backgroundColor: COLORS.surfaceLow,
    color: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: "700",
  },
  detailsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  detailCell: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLow,
    gap: 4,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  billCard: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 12,
  },
  billEyebrow: {
    color: "#C7D2FE",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  billAmount: {
    color: COLORS.surface,
    fontSize: 28,
    fontWeight: "800",
  },
  billSubtext: {
    color: "#DCE1FF",
    fontSize: 12,
    lineHeight: 18,
  },
  dueBadge: {
    overflow: "hidden",
    color: COLORS.surface,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 10,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionCard: {
    width: "48%",
    minHeight: 116,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 5,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  actionIconText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  actionTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  noticeCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noticeIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.secondarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeIconText: {
    color: COLORS.secondary,
    fontWeight: "800",
  },
  noticeCopy: {
    flex: 1,
    gap: 4,
  },
  emptyCard: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navItem: {
    minWidth: 64,
    alignItems: "center",
    gap: 2,
  },
  navIcon: {
    color: COLORS.muted,
    fontSize: 19,
    fontWeight: "700",
  },
  navLabel: {
    color: COLORS.muted,
    fontSize: 10,
  },
  navActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  errorTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});
