import { ENDPOINT, type ServerConfiguration } from "./constants";

export const getServerConfiguration = async (token: string): Promise<ServerConfiguration> => {
  const response = await fetch(`${ENDPOINT}/server-config`, {
    headers: { authorization: `Bearer ${token}` }
  });

  const json = await response.json();
  if (!json.success) throw new Error(json.details.message);

  return json.config;
};

export const updateServerConfiguration = async (token: string, configuration: ServerConfiguration): Promise<void> => {
  const response = await fetch(`${ENDPOINT}/server-config`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(configuration)
  });

  const json = await response.json();
  if (!json.success) throw new Error(json.details.message);
};
