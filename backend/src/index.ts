import { Elysia, t } from "elysia";
import fs from "node:fs/promises";

import { jwt } from '@elysiajs/jwt'
import { cors } from '@elysiajs/cors'

import {
  Database,
  User,
  UserRole,
  Log,
  LogAction,
  LoginErrorType,
  ChangePasswordErrorType,
  UserPayload
} from "./types"

import {
  UserNotExistsError,
  PasswordWrongError,
  PasswordTooShortError,
  PasswordUppercaseAndLowercaseError,
  PasswordSpecialCharacterAndNumberError,
} from "./errors"

import { readDatabaseFromJSON, saveDatabaseToJSON } from "./database"
import { createLog, logsForUserId } from "./logs";
import { validateUser, changePassword, generatePassword } from "./users";
import { wait } from "./wait";
import { getTokenFromHeader } from "./headers";

const database = await readDatabaseFromJSON();

const app = new Elysia()
  .use(cors())
  .use(jwt({
    name: "jwt",
    secret: "UN_MDP_À_GARDER_SECRET!!!"
  }))
  .post("/login", async ({ jwt, body }) => {
    try {
      const user = await validateUser(database, body.username, body.password);

      const payload = {
        id: user.id,
        name: user.name,
        role: user.role
      };

      const token = await jwt.sign(payload);

      user.unsuccessful_auth_attempts = 0;
      await createLog(database, user.id, LogAction.LOGIN_SUCESS);

      if (body.password === "") {
        return {
          success: false,
          details: {
            type: LoginErrorType.CHANGE_PASSWORD_EMPTY,
            message: "You must define a password",
            token
          }
        }
      }

      const logs = logsForUserId(database, user.id);
      const twoLastLogs = logs.slice(1, 3);

      // if we have ACCOUNT_UNBLOCKED and CHANGE_PASSWORD logs
      if (twoLastLogs.length === 2 && twoLastLogs[1].action === LogAction.ACCOUNT_UNBLOCKED && twoLastLogs[0].action === LogAction.CHANGE_PASSWORD) {
        return {
          success: false,
          details: {
            type: LoginErrorType.CHANGE_PASSWORD,
            message: "You must change your password",
            token
          }
        }
      }

      return {
        success: true,
        user: payload,
        token
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
        await createLog(database, user.id, LogAction.LOGIN_FAIL);

        // prevent spamming requests
        await wait(database.config.wait_when_failed_ms);
        
        if (user.unsuccessful_auth_attempts >= database.config.max_auth_attempts) {
          user.blocked = true;
          await createLog(database, user.id, LogAction.ACCOUNT_BLOCKED);

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
  .post("/change-password", async ({ jwt, body, headers }) => {
    const user = await jwt.verify(getTokenFromHeader(headers)) as false | UserPayload;

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
      await createLog(database, user.id, LogAction.CHANGE_PASSWORD);

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
  .get("/me", async ({ jwt, headers }) => {
    const user = await jwt.verify(getTokenFromHeader(headers)) as false | UserPayload;

    if (!user) {
      return {
        success: false,
        details: {
          message: "You must be logged in"
        }
      }
    }

    return {
      success: true,
      user
    }
  })
  .get("/commercials", async ({ jwt, headers }) => {
    const user = await jwt.verify(getTokenFromHeader(headers)) as false | UserPayload;

    if (!user) {
      return {
        success: false,
        details: {
          message: "You must be logged in"
        }
      }
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.COMMERCIALS) {
      return {
        success: false,
        details: {
          message: "You do not have the necessary permissions"
        }
      }
    }

    const commercials = database.users.filter(user => user.role === UserRole.COMMERCIALS);
    return {
      success: true,
      commercials
    }
  })
  .get("/residentials", async ({ jwt, headers }) => {
    const user = await jwt.verify(getTokenFromHeader(headers)) as false | UserPayload;

    if (!user) {
      return {
        success: false,
        details: {
          message: "You must be logged in"
        }
      }
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.RESIDENTIALS) {
      return {
        success: false,
        details: {
          message: "You do not have the necessary permissions"
        }
      }
    }

    const residentials = database.users.filter(user => user.role === UserRole.RESIDENTIALS);
    return {
      success: true,
      residentials
    }
  })
  .get("/server-config", async ({ jwt, headers }) => {
    const user = await jwt.verify(getTokenFromHeader(headers)) as false | UserPayload;

    if (!user) {
      return {
        success: false,
        details: {
          message: "You must be logged in"
        }
      }
    }

    if (user.role !== UserRole.ADMIN) {
      return {
        success: false,
        details: {
          message: "You do not have the necessary permissions"
        }
      }
    }

    return {
      success: true,
      config: database.config
    }
  })
  .post("/server-config", async ({ jwt, body, headers }) => {
    const user = await jwt.verify(getTokenFromHeader(headers)) as false | UserPayload;

    if (!user) {
      return {
        success: false,
        details: {
          message: "You must be logged in"
        }
      }
    }

    if (user.role !== UserRole.ADMIN) {
      return {
        success: false,
        details: {
          message: "You do not have the necessary permissions"
        }
      }
    }

    database.config = body;
    await saveDatabaseToJSON(database);

    return { success: true }
  }, {
    body: t.Object({
      max_auth_attempts: t.Number(),
      wait_when_failed_ms: t.Number(),
      password_min_length: t.Number(),
      password_one_uppercase_and_one_lowercase: t.Boolean(),
      password_one_special_character_and_one_number: t.Boolean(),
    })
  })
  .get("/blocked", async ({ jwt, headers }) => {
    const user = await jwt.verify(getTokenFromHeader(headers)) as false | UserPayload;

    if (!user) {
      return {
        success: false,
        details: {
          message: "You must be logged in"
        }
      }
    }

    if (user.role !== UserRole.ADMIN) {
      return {
        success: false,
        details: {
          message: "You do not have the necessary permissions"
        }
      }
    }

    const blocked = database.users.filter(user => user.blocked);
    return {
      success: true,
      blocked
    }
  })
  .post("/unblock", async ({ jwt, body, headers }) => {
    const user = await jwt.verify(getTokenFromHeader(headers)) as false | UserPayload;

    if (!user) {
      return {
        success: false,
        details: {
          message: "You must be logged in"
        }
      }
    }

    if (user.role !== UserRole.ADMIN) {
      return {
        success: false,
        details: {
          message: "You do not have the necessary permissions"
        }
      }
    }

    const userToUnblock = database.users.find(user => user.name === body.username)!;
    userToUnblock.blocked = false;
    userToUnblock.unsuccessful_auth_attempts = 0;
    await createLog(database, userToUnblock.id, LogAction.ACCOUNT_UNBLOCKED);

    const newPassword = generatePassword(database);
    userToUnblock.password = await Bun.password.hash(newPassword, { algorithm: "argon2id" });
    await createLog(database, userToUnblock.id, LogAction.CHANGE_PASSWORD);
    
    return {
      success: true,
      password: newPassword
    };
  }, {
    body: t.Object({
      username: t.String(),
    })
  })
  .listen(3000);
