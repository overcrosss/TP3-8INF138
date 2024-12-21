export class PasswordWrongError extends Error {
  constructor(public userId: number) {
    super("Password is wrong");
    this.name = "PasswordWrongError";
  }
}

export class UserNotExistsError extends Error {
  constructor() {
    super("User does not exist");
    this.name = "UserNotExistsError";
  }
}

export class PasswordTooShortError extends Error {
  constructor(public minLength: number) {
    super(`Password should be at least ${minLength} characters`);
    this.name = "PasswordTooShortError";
  }
}

export class PasswordUppercaseAndLowercaseError extends Error {
  constructor() {
    super(`Password should be at least contain one uppercase and one lowercase character`);
    this.name = "PasswordUppercaseAndLowercaseError";
  }
}

export class PasswordSpecialCharacterAndNumberError extends Error {
  constructor() {
    super(`Password should be at least contain one special character and one number`);
    this.name = "PasswordSpecialCharacterAndNumberError";
  }
}