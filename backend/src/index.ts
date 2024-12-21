import { Elysia, t } from "elysia";
import fs from "node:fs/promises";
import { jwt } from '@elysiajs/jwt'

enum UserRole {
  ADMIN = "admin",
  RESIDENTIALS = "residentials",
  COMMERCIALS = "commercials"
}

type User = {
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

enum LogAction {
  LOGIN_FAIL = "login_fail",
  LOGIN_SUCESS = "login_success",
  CHANGE_PASSWORD = "change_password",
  ACCOUNT_BLOCKED = "account_blocked",
  ACCOUNT_UNBLOCKED = "account_unblocked"
}

type Log = {
  user_id: number;
  action: LogAction;
  done_at: number; // timestamp : Date.now()
}

type ServerConfiguration = {
  max_auth_attempts: number;
  wait_when_failed_ms: number;

  password_min_length: number;
  password_one_uppercase_and_one_lowercase: boolean;
  password_one_special_character_and_one_number: boolean;
}

type Database = {
  users: Array<User>
  logs: Array<Log>
  config: ServerConfiguration
}

const checkFileExists = async (file: string): Promise<boolean> => {
  try {
    await fs.access(file);
    return true;
  }
  catch (error) {
    return false;
  }
}

const readDatabaseFromJSON = async (): Promise<Database> => {
  let database: Database;

  if (await checkFileExists("database.json")) {
    database = JSON.parse(await fs.readFile("database.json", "utf-8"));
  }
  else {
    database = {
      users: [],
      logs: [],
      config: {
        max_auth_attempts: 3,
        wait_when_failed_ms: 5000, // 5 seconds
        password_min_length: 8,
        password_one_uppercase_and_one_lowercase: true,
        password_one_special_character_and_one_number: true
      }
    }

    await saveDatabaseToJSON(database);

    await createUser(database, "Administrateur", UserRole.ADMIN, "");
    await createUser(database, "Utilisateur1", UserRole.RESIDENTIALS, "");
    await createUser(database, "Utilisateur2", UserRole.COMMERCIALS, "");
  }

  return database;
}

const saveDatabaseToJSON = async (database: Database): Promise<void> => {
  await fs.writeFile("database.json", JSON.stringify(database, null, 2));
};

const createUser = async (database: Database, name: string, role: UserRole, password: string): Promise<void> => {
  // see https://bun.sh/docs/api/hashing
  const passwordHashed = password && await Bun.password.hash(password, {
    algorithm: "bcrypt"
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

const createLog = async (userId: number, action: LogAction): Promise<void> => {
  const log: Log = {
    user_id: userId,
    action,
    done_at: Date.now()
  };

  database.logs.push(log);
  await saveDatabaseToJSON(database);
}

class PasswordWrongError extends Error {
  constructor(public userId: number) {
    super("Password is wrong");
    this.name = "PasswordWrongError";
  }
}

class UserNotExistsError extends Error {
  constructor() {
    super("User does not exist");
    this.name = "UserNotExistsError";
  }
}

enum LoginErrorType {
  USER_NOT_EXISTS = "user_not_exists",
  PASSWORD_WRONG = "password_wrong",
  CHANGE_PASSWORD = "change_password",
  CHANGE_PASSWORD_EMPTY = "change_password_empty"
}

enum ChangePasswordErrorType {
  TOO_SHORT = "too_short",
  PASSWORD_WRONG = "password_wrong",
  UPPERCASE_AND_LOWERCASE = "uppercase_and_lowercase",
  SPECIAL_CHARACTER_AND_NUMBER = "special_character_and_number"
}

const validateUser = async (database: Database, name: string, password: string): Promise<User> => {
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

class PasswordTooShortError extends Error {
  constructor(public minLength: number) {
    super(`Password should be at least ${minLength} characters`);
    this.name = "PasswordTooShortError";
  }
}

class PasswordUppercaseAndLowercaseError extends Error {
  constructor() {
    super(`Password should be at least contain one uppercase and one lowercase character`);
    this.name = "PasswordUppercaseAndLowercaseError";
  }
}

class PasswordSpecialCharacterAndNumberError extends Error {
  constructor() {
    super(`Password should be at least contain one special character and one number`);
    this.name = "PasswordSpecialCharacterAndNumberError";
  }
}

const changePassword = async (database: Database, name: string, oldPassword: string, newPassword: string): Promise<void> => {
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

const logsForUserId = (database: Database, userId: number): Array<Log> => {
  const logs = database.logs.filter(log => log.user_id === userId);
  
  // sort by descending order
  logs.sort((a, b) => b.done_at - a.done_at);
  
  return logs;
}

type UserPayload = {
  id: number;
  name: string;
  role: UserRole;
}

const database = await readDatabaseFromJSON();

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const app = new Elysia()
  .use(jwt({
    name: "jwt",
    secret: "UN_MDP_À_GARDER_SECRET!!!"
  }))
  .post("/login", async ({ jwt, body, cookie: { auth } }) => {
    try {
      const user = await validateUser(database, body.username, body.password);

      const payload = {
        id: user.id,
        name: user.name,
        role: user.role
      };

      auth.set({
        value: await jwt.sign(payload),
        httpOnly: true, // very important to prevent accessing the cookie from document.cookie
        maxAge: 7 * 86400, // 7 days
        path: '/',
      });

      user.unsuccessful_auth_attempts = 0;
      await createLog(user.id, LogAction.LOGIN_SUCESS);

      if (body.password === "") {
        return {
          success: false,
          details: {
            type: LoginErrorType.CHANGE_PASSWORD_EMPTY,
            message: "You must define a password"
          }
        }
      }

      const logs = logsForUserId(database, user.id);
      const twoLastLogs = logs.slice(0, 2);

      // if we have ACCOUNT_UNBLOCKED and CHANGE_PASSWORD logs
      if (twoLastLogs.length === 2 && twoLastLogs[0].action === LogAction.ACCOUNT_UNBLOCKED && twoLastLogs[1].action === LogAction.CHANGE_PASSWORD) {
        return {
          success: false,
          details: {
            type: LoginErrorType.CHANGE_PASSWORD,
            message: "You must change your password"
          }
        }
      }

      return {
        success: true,
        user: payload
      }
    }
    catch (error) {
      if (error instanceof UserNotExistsError) {
        return {
          success: false,
          details: {
            type: LoginErrorType.USER_NOT_EXISTS,
            message: error.message,
          }
        }
      }
      else if (error instanceof PasswordWrongError) {
        const user = database.users.find(user => user.id === error.userId)!;
        user.unsuccessful_auth_attempts++;
        await createLog(user.id, LogAction.LOGIN_FAIL);

        // prevent spamming requests
        await wait(database.config.wait_when_failed_ms);
        
        if (user.unsuccessful_auth_attempts >= database.config.max_auth_attempts) {
          user.blocked = true;
          await createLog(user.id, LogAction.ACCOUNT_BLOCKED);

          return {
            success: false,
            details: {
              type: LoginErrorType.PASSWORD_WRONG,
              message: "You have reached the maximum number of attempts. Your account is blocked"
            }
          }
        }

        return {
          success: false,
          details: {
            type: LoginErrorType.PASSWORD_WRONG,
            message: error.message,
          }
        }
      }
    }
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String()
    })
  })
  .post("/change-password", async ({ jwt, body, cookie: { auth } }) => {
    const user = await jwt.verify(auth.value) as false | UserPayload;

    if (!user) {
      return {
        success: false,
        details: {
          message: "You must be logged in"
        }
      }
    }

    try {
      await changePassword(database, user.name, body.oldPassword, body.newPassword);
      await createLog(user.id, LogAction.CHANGE_PASSWORD);

      return { success: true }
    }
    catch (error) {
      if (error instanceof PasswordTooShortError) {
        return {
          success: false,
          details: {
            type: ChangePasswordErrorType.TOO_SHORT,
            message: error.message
          }
        };
      }
      else if (error instanceof PasswordUppercaseAndLowercaseError) {
        return {
          success: false,
          details: {
            type: ChangePasswordErrorType.UPPERCASE_AND_LOWERCASE,
            message: error.message
          }
        };
      }
      else if (error instanceof PasswordSpecialCharacterAndNumberError) {
        return {
          success: false,
          details: {
            type: ChangePasswordErrorType.SPECIAL_CHARACTER_AND_NUMBER,
            message: error.message
          }
        };
      }
      else if (error instanceof PasswordWrongError) {
        return {
          success: false,
          details: {
            type: ChangePasswordErrorType.PASSWORD_WRONG,
            message: error.message
          }
        }
      }
    }
  }, {
    body: t.Object({
      oldPassword: t.String(),
      newPassword: t.String()
    })
  })
  .listen(3000);
