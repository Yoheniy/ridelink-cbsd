export type UserRole = "admin" | "passenger" | "driver";
export type UserStatus = "active" | "pending" | "deactivated";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  role: UserRole;
  status: UserStatus;
  rating: number;
  banned: boolean;
  banReason?: string | null;
  createdAt: string;
  updatedAt: string;
  image?: string | null;
};
