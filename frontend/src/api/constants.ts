export const ENDPOINT = "http://localhost:3000";

export enum LoginErrorType {
  USER_NOT_EXISTS = "user_not_exists",
  PASSWORD_WRONG = "password_wrong",
  CHANGE_PASSWORD = "change_password",
  CHANGE_PASSWORD_EMPTY = "change_password_empty"
}

export enum ChangePasswordErrorType {
  TOO_SHORT = "too_short",
  PASSWORD_WRONG = "password_wrong",
  UPPERCASE_AND_LOWERCASE = "uppercase_and_lowercase",
  SPECIAL_CHARACTER_AND_NUMBER = "special_character_and_number"
}

export enum UserRole {
  ADMIN = "admin",
  RESIDENTIALS = "residentials",
  COMMERCIALS = "commercials"
}

export type UserPayload = {
  id: number;
  name: string;
  role: UserRole;
}

export type LoginResponse = {
  success: false
  details: {
    type: LoginErrorType
    message: string
    token?: string
  }
} | {
  success: true
  user: UserPayload
  token: string
}

export type ChangePasswordResponse = {
  success: false
  details: {
    type: ChangePasswordErrorType
    message: string
  }
} | {
  success: true
}

export type UserResponse = {
  success: false
  details: {
    message: string
  }
} | {
  success: true
  user: UserPayload
}

export type ServerConfiguration = {
  max_auth_attempts: number;
  wait_when_failed_ms: number;

  password_min_length: number;
  password_one_uppercase_and_one_lowercase: boolean;
  password_one_special_character_and_one_number: boolean;
}
