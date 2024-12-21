export enum UserRole {
  ADMIN = "admin",
  RESIDENTIALS = "residentials",
  COMMERCIALS = "commercials"
}

export type User = {
  id: number;
  name: string;
  role: UserRole;
  password: string;
  /**
   * when `true`, the administrator must unblock the user
   * by changing their password
   */
  blocked: boolean
  unsuccessful_auth_attempts: number;
}

export enum LogAction {
  LOGIN_FAIL = "login_fail",
  LOGIN_SUCCESS = "login_success",
  CHANGE_PASSWORD = "change_password",
  ACCOUNT_BLOCKED = "account_blocked",
  ACCOUNT_UNBLOCKED = "account_unblocked"
}

export type Log = {
  user_id: number;
  action: LogAction;
  done_at: number; // timestamp : Date.now()
}

export type ServerConfiguration = {
  max_auth_attempts: number;
  wait_when_failed_ms: number;

  password_min_length: number;
  password_one_uppercase_and_one_lowercase: boolean;
  password_one_special_character_and_one_number: boolean;
}

export type Database = {
  users: Array<User>
  logs: Array<Log>
  config: ServerConfiguration
}

export type UserPayload = {
  id: number;
  name: string;
  role: UserRole;
}

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
