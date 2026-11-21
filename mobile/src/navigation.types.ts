export type AccountRole = "LANDLORD" | "MANAGER" | "STUDENT";

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: { role?: AccountRole } | undefined;
  Dashboard: undefined;
  Profile: undefined;
  BuildingSetup: { onboarding?: boolean } | undefined;
};
