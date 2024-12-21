export const getTokenFromHeader = (headers: Record<string, string | undefined>): string | undefined => {
  const auth = headers.authorization;
  if (!auth) return undefined;

  const parts = auth.split(' ');
  if (parts.length !== 2) return undefined;

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return undefined;

  return token;
};
