import { ENDPOINT, type UserPayload } from "./constants";

export async function commercials (token: string): Promise<Array<UserPayload>> {
  const response = await fetch(`${ENDPOINT}/commercials`, {
    headers: { authorization: `Bearer ${token}` }
  });

  const json = await response.json();
  if (!json.success) throw new Error(json.details.message);

  return json.commercials;
};
