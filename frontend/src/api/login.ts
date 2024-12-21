import { ENDPOINT, type LoginResponse } from "./constants";

export async function login (username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${ENDPOINT}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  return response.json();
};
