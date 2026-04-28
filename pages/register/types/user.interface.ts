export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  nickname: string;
  email: string;
  phone: string;
  password: string;
  role: "client" | "admin";
  birthDate: string;
}

export type IUserPayload = Omit<IUser, "id">;
