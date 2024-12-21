import { Database, UserRole, User } from "./types";
import { saveDatabaseToJSON  } from "./database";
import {
  PasswordSpecialCharacterAndNumberError,
  PasswordTooShortError,
  PasswordUppercaseAndLowercaseError,
  PasswordWrongError,
  UserNotExistsError
} from "./errors"

export const createUser = async (database: Database, name: string, role: UserRole, password: string): Promise<void> => {
  // see https://bun.sh/docs/api/hashing
  const passwordHashed = password && await Bun.password.hash(password, {
    algorithm: "argon2id"
  });

  const user: User = {
    id: database.users.length + 1,
    name, role,
    password: passwordHashed,
    blocked: false,
    unsuccessful_auth_attempts: 0
  };

  database.users.push(user);
  await saveDatabaseToJSON(database);
};

export const validateUser = async (database: Database, name: string, password: string): Promise<User> => {
  const user = database.users.find(user => user.name === name);
  if (!user) throw new UserNotExistsError();

  if (password === "" && user.password === "") {
    return user;
  }
  
  // see https://bun.sh/docs/api/hashing
  const isMatch = await Bun.password.verify(password, user.password);
  if (!isMatch) throw new PasswordWrongError(user.id);

  return user;
};

export const changePassword = async (database: Database, name: string, oldPassword: string, newPassword: string): Promise<void> => {
  const user = await validateUser(database, name, oldPassword);
  const { config } = database;

  if (newPassword.length < config.password_min_length) {
    throw new PasswordTooShortError(config.password_min_length);
  }

  if (config.password_one_uppercase_and_one_lowercase) {
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)) {
      throw new PasswordUppercaseAndLowercaseError();
    }
  }

  if (config.password_one_special_character_and_one_number) {
    if (!/[0-9]/.test(newPassword) || !/[!?@#$%^&*]/.test(newPassword)) {
      throw new PasswordSpecialCharacterAndNumberError();
    }
  }

  // see https://bun.sh/docs/api/hashing
  const newPasswordHashed = await Bun.password.hash(newPassword, {
    algorithm: "argon2id"
  });

  user.password = newPasswordHashed;
  await saveDatabaseToJSON(database);
};

import { generate } from "generate-password";
export const generatePassword = (database: Database): string => {
  return generate({
    length: database.config.password_min_length,
    numbers: database.config.password_one_special_character_and_one_number,
    symbols: database.config.password_one_special_character_and_one_number,
    lowercase: database.config.password_one_uppercase_and_one_lowercase,
    uppercase: database.config.password_one_uppercase_and_one_lowercase,
    strict: true
  })
};
