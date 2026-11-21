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
import { FeatureEmptyState } from "../../components/common/FeatureEmptyState";
import { RoomInventory } from "../../components/common/RoomInventory";
import { useAuthStore } from "../../store/auth.store";
import api, { endpoints } from "../../services/api";
import { COLORS } from "../../theme";

type LandlordTab = "home" | "rooms" | "approvals" | "finance";

interface LandlordDashboardData {
  pg?: { name?: string; city?: string };
  occupancy?: {
    totalRooms?: number;
    occupiedRooms?: number;
    availableRooms?: number;
    noticeRooms?: number;
    occupancyRate?: number | string;
  };
  revenue?: {
    totalMonthlyRevenue?: number;
    rentCollected?: number;
    pendingRent?: number;
    monthlyExpenses?: number;
    netIncome?: number;
  };
  recentPayments?: any[];
  recentComplaints?: any[];
}

export const LandlordDashboard = () => {
  const { user, pgId } = useAuthStore.getState();
  const [tab, setTab] = React.useState<LandlordTab>("home");
  const [retry, setRetry] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dashboard, setDashboard] = React.useState<LandlordDashboardData>({});

  React.useEffect(() => {
    let active = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(endpoints.dashboard.landlord);
        if (active && response.data?.dashboard) {
          setDashboard(response.data.dashboard);
        }
      } catch (requestError: unknown) {
        if (!active) return;
        console.error("Failed to load landlord dashboard:", requestError);
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

  const occupancy = dashboard.occupancy ?? {};
  const revenue = dashboard.revenue ?? {};
  const collected = revenue.rentCollected ?? 0;
  const expenses = revenue.monthlyExpenses ?? 0;
  const payments = dashboard.recentPayments ?? [];
  const complaints = dashboard.recentComplaints ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        testID="landlord-dashboard-scroll-view"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader
          name={user?.name}
          role="Landlord"
          propertyName={dashboard.pg?.name || "Nivasa"}
          location={dashboard.pg?.city}
        />

        {loading && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.mutedText}>Syncing property data...</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => setRetry((value) => value + 1)}>
              <Text style={styles.linkText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {tab === "home" && (
          <>
            <View style={styles.welcomeCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.slice(0, 1).toUpperCase() || "N"}
                </Text>
              </View>
              <View style={styles.welcomeCopy}>
                <Text style={styles.welcomeTitle}>
                  Good morning, {user?.name || "Landlord"}
                </Text>
                <Text style={styles.mutedText}>
                  {dashboard.pg?.name || "Your PG"}{dashboard.pg?.city ? ` • ${dashboard.pg.city}` : ""}
                </Text>
              </View>
              <Text style={styles.liveBadge}>LIVE</Text>
            </View>

            <View style={styles.metricsGrid}>
              <MetricCard
                label="Collected"
                value={formatCurrency(collected)}
                footnote="Rent received"
              />
              <MetricCard
                label="Overdue"
                value={formatCurrency(revenue.pendingRent ?? 0)}
                footnote="Pending rent"
                alert
              />
              <MetricCard
                label="Occupancy"
                value={`${occupancy.occupiedRooms ?? 0}/${occupancy.totalRooms ?? 0}`}
                footnote={`${occupancy.occupancyRate ?? 0}% occupied`}
              />
              <MetricCard
                label="Help desk"
                value={String(complaints.length)}
                footnote="Recent complaints"
                alert={complaints.length > 0}
              />
            </View>

            <View style={styles.quickActions}>
              <QuickAction icon="⌂" label="Rooms" onPress={() => setTab("rooms")} />
              <QuickAction icon="₹" label="Payments" onPress={() => setTab("finance")} />
              <QuickAction icon="!" label="Alerts" onPress={() => setTab("home")} />
            </View>

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.cardTitle}>Rent & Expenses</Text>
                  <Text style={styles.mutedText}>This month</Text>
                </View>
                <Text style={styles.legend}>■ Rent  ■ Expenses</Text>
              </View>
              <View style={styles.barChart}>
                <Bar label="Collected" value={collected} max={Math.max(collected, expenses, 1)} color={COLORS.primary} />
                <Bar label="Expenses" value={expenses} max={Math.max(collected, expenses, 1)} color={COLORS.secondary} />
              </View>
              <View style={styles.moneySummary}>
                <View style={styles.summaryPanel}>
                  <Text style={styles.mutedSmall}>NET INCOME</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(revenue.netIncome ?? 0)}
                  </Text>
                </View>
                <View style={styles.summaryPanel}>
                  <Text style={styles.mutedSmall}>AVAILABLE ROOMS</Text>
                  <Text style={styles.summaryValue}>
                    {occupancy.availableRooms ?? 0}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              <Pressable onPress={() => setTab("finance")}>
                <Text style={styles.linkText}>View ledger</Text>
              </Pressable>
            </View>
            {payments.length ? (
              payments.slice(0, 3).map((payment, index) => (
                <PaymentRow key={payment._id ?? index} payment={payment} />
              ))
            ) : (
              <View style={styles.card}>
                <Text style={styles.mutedText}>No recent payments to show.</Text>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Help desk</Text>
              <Text style={styles.mutedSmall}>{complaints.length} RECENT</Text>
            </View>
            {complaints.length ? (
              complaints.map((complaint, index) => (
                <View key={complaint._id ?? index} style={styles.activityRow}>
                  <View style={styles.alertIcon}>
                    <Text style={styles.alertIconText}>!</Text>
                  </View>
                  <View style={styles.activityCopy}>
                    <Text style={styles.cardTitle}>{complaint.title || "PG complaint"}</Text>
                    <Text style={styles.mutedText}>{complaint.status || "OPEN"}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.card}>
                <Text style={styles.mutedText}>No recent complaints.</Text>
              </View>
            )}
          </>
        )}

        {tab === "rooms" && <RoomInventory />}

        {tab === "approvals" && (
          <View testID="landlord-approvals-content" style={styles.tabContent}>
            <View style={styles.pageHeading}>
              <Text style={styles.eyebrow}>RESIDENT CHECKLIST</Text>
              <Text style={styles.pageTitle}>Approval review</Text>
              <Text style={styles.mutedText}>
                Review resident documents and onboarding status.
              </Text>
            </View>
            <View style={styles.applicantCard}>
              <Text style={styles.cardTitle}>Applicant details</Text>
              <Text style={styles.mutedText}>
                Applicant identity, room, and rent details will appear here when
                the KYC service is connected.
              </Text>
              <Text style={styles.previewBadge}>KYC DATA NOT CONNECTED</Text>
            </View>
            <View style={styles.approvalMatrix}>
              <Text style={styles.sectionTitle}>Trust & verification matrix</Text>
              <View style={styles.approvalGrid}>
                <VerificationCard title="Identity auth" />
                <VerificationCard title="Campus ID" />
                <VerificationCard title="Guardian" />
                <VerificationCard title="Deposit" />
              </View>
            </View>
            <FeatureEmptyState
              icon="✓"
              title="KYC review is not connected"
              message="These controls are a UI preview. No approval or document action is currently available."
            />
            <Button mode="contained" disabled>
              Approve resident & issue key card
            </Button>
            <Button mode="outlined" disabled>
              Decline / request documents
            </Button>
          </View>
        )}

        {tab === "finance" && (
          <>
            <View style={styles.pageHeading}>
              <Text style={styles.eyebrow}>RENT VERIFICATION</Text>
              <Text style={styles.pageTitle}>Verify rent claims</Text>
              <Text style={styles.mutedText}>
                Review the payment records currently available for your property.
              </Text>
            </View>
            <View style={styles.metricsGrid}>
              <MetricCard label="Collected" value={formatCurrency(collected)} footnote="Rent received" />
              <MetricCard label="Pending rent" value={formatCurrency(revenue.pendingRent ?? 0)} footnote="Awaiting payment" alert />
              <MetricCard label="Expenses" value={formatCurrency(expenses)} footnote="This month" />
              <MetricCard label="Net income" value={formatCurrency(revenue.netIncome ?? 0)} footnote="After expenses" />
            </View>
            <Text style={styles.sectionTitle}>Recent payments</Text>
            {payments.length ? (
              payments.map((payment, index) => (
                <PaymentRow key={payment._id ?? index} payment={payment} />
              ))
            ) : (
              <FeatureEmptyState
                icon="₹"
                title="No rent claims available"
                message="Payment claims will appear here when they are recorded by the rent service."
              />
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem testID="landlord-tab-home" label="Overview" icon="⌂" active={tab === "home"} onPress={() => setTab("home")} />
        <NavItem testID="landlord-tab-rooms" label="Rooms" icon="▣" active={tab === "rooms"} onPress={() => setTab("rooms")} />
        <NavItem testID="landlord-tab-approvals" label="Approvals" icon="✓" active={tab === "approvals"} onPress={() => setTab("approvals")} />
        <NavItem testID="landlord-tab-ledger" label="Ledger" icon="₹" active={tab === "finance"} onPress={() => setTab("finance")} />
      </View>
    </View>
  );
};

const formatCurrency = (amount: number) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

const MetricCard = ({
  label,
  value,
  footnote,
  alert,
}: {
  label: string;
  value: string;
  footnote: string;
  alert?: boolean;
}) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricLabel}>{label.toUpperCase()}</Text>
    <Text style={[styles.metricValue, alert && styles.alertValue]}>{value}</Text>
    <Text style={styles.mutedSmall}>{footnote}</Text>
  </View>
);

const VerificationCard = ({ title }: { title: string }) => (
  <View style={styles.verificationCard}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.mutedSmall}>Not connected</Text>
  </View>
);

const QuickAction = ({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) => (
  <Pressable style={styles.quickAction} onPress={onPress}>
    <Text style={styles.quickIcon}>{icon}</Text>
    <Text style={styles.quickLabel}>{label}</Text>
  </Pressable>
);

const Bar = ({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) => (
  <View style={styles.barRow}>
    <Text style={styles.mutedSmall}>{label}</Text>
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          { width: `${Math.max(value > 0 ? 4 : 0, (value / max) * 100)}%`, backgroundColor: color },
        ]}
      />
    </View>
    <Text style={styles.barValue}>{formatCurrency(value)}</Text>
  </View>
);

const PaymentRow = ({ payment }: { payment: any }) => (
  <View style={styles.activityRow}>
    <View style={styles.paymentIcon}>
      <Text style={styles.paymentIconText}>₹</Text>
    </View>
    <View style={styles.activityCopy}>
      <Text style={styles.cardTitle}>
        {payment.paymentMethod || "Payment"} • {formatCurrency(payment.amount || 0)}
      </Text>
      <Text style={styles.mutedText}>
        {payment.paymentDate
          ? new Date(payment.paymentDate).toLocaleDateString("en-IN")
          : "Date unavailable"}
      </Text>
    </View>
    <Text style={styles.paymentStatus}>{payment.paymentStatus || "PENDING"}</Text>
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
  <Pressable accessibilityRole="button" testID={testID} style={styles.navItem} onPress={onPress}>
    <Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text>
    <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mutedText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  mutedSmall: {
    color: COLORS.outline,
    fontSize: 10,
    lineHeight: 15,
  },
  welcomeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  welcomeCopy: {
    flex: 1,
  },
  welcomeTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  liveBadge: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: "800",
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: "hidden",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48%",
    minHeight: 110,
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  metricValue: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "800",
  },
  alertValue: {
    color: COLORS.danger,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },
  quickAction: {
    minWidth: 70,
    alignItems: "center",
    gap: 5,
  },
  quickIcon: {
    width: 36,
    height: 36,
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceHigh,
    color: COLORS.primary,
    fontSize: 19,
    fontWeight: "700",
  },
  quickLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "600",
  },
  card: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "700",
  },
  legend: {
    color: COLORS.muted,
    fontSize: 9,
  },
  barChart: {
    gap: 14,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceHigh,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 5,
  },
  barValue: {
    minWidth: 64,
    textAlign: "right",
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "700",
  },
  moneySummary: {
    flexDirection: "row",
    gap: 10,
  },
  summaryPanel: {
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 8,
    gap: 5,
  },
  summaryValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },
  activityCopy: {
    flex: 1,
    gap: 3,
  },
  paymentIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentIconText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  paymentStatus: {
    color: COLORS.secondary,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  alertIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.secondarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  alertIconText: {
    color: COLORS.secondary,
    fontWeight: "800",
  },
  pageHeading: {
    gap: 5,
  },
  tabContent: {
    gap: 16,
  },
  applicantCard: {
    gap: 10,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  previewBadge: {
    alignSelf: "flex-start",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.secondarySoft,
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "700",
  },
  approvalMatrix: {
    gap: 10,
  },
  approvalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  verificationCard: {
    width: "48%",
    minHeight: 76,
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
  },
  eyebrow: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  pageTitle: {
    color: COLORS.primary,
    fontSize: 26,
    fontWeight: "700",
  },
  errorCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.dangerSoft,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  errorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 12,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navItem: {
    minWidth: 72,
    alignItems: "center",
    gap: 2,
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
  navActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
