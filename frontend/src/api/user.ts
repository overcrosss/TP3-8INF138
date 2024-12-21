import { ENDPOINT, type UserResponse } from "./constants";

export async function user (token: string): Promise<UserResponse> {
  const response = await fetch(`${ENDPOINT}/me`, {
    headers: { authorization: `Bearer ${token}` }
  });

  return response.json();
};
