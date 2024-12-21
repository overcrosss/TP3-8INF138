import { ENDPOINT, type Log } from "./constants";

export async function getLogs (token: string): Promise<Array<Log>> {
  const response = await fetch(`${ENDPOINT}/logs`, {
    headers: { authorization: `Bearer ${token}` }
  });

  const json = await response.json();
  if (!json.success) throw new Error(json.details.message);

  return json.logs;
};
