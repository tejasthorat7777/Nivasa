export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  collegeName?: string;
  studentCode?: string;
  role: "LANDLORD" | "MANAGER" | "STUDENT";
  pgId?: string;
  isActive: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
}