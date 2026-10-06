// Reads a setting from the process environment. Next.js loads .env files into process.env.
export function env(name: string, fallback = ''): string {
  const value = process.env[name];
  return value !== undefined && value !== '' ? value : fallback;
}

export function envRequired(name: string): string {
  const value = env(name);
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}
