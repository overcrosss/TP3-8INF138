import { ENDPOINT, type ChangePasswordResponse } from "./constants";

export async function changePassword (oldPassword: string, newPassword: string, token: string): Promise<ChangePasswordResponse> {
  const response = await fetch(`${ENDPOINT}/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  return response.json();
};
