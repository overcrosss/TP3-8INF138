import { ENDPOINT, type UserPayload } from "./constants";

export async function blockedUsers (token: string): Promise<Array<UserPayload>> {
  const response = await fetch(`${ENDPOINT}/blocked`, {
    headers: { authorization: `Bearer ${token}` }
  });

  const json = await response.json();
  if (!json.success) throw new Error(json.details.message);

  return json.blocked;
}

/**
 * @returns the new password for the unblocked user
 */
export async function unblockUser (token: string, username: string): Promise<string> {
  const response = await fetch(`${ENDPOINT}/unblock`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username })
  });

  const json = await response.json();
  if (!json.success) throw new Error(json.details.message);

  return json.password;
}