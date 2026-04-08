/**
 * Set `apiBaseUrl` to your backend origin (no trailing slash) to call the real API.
 * An empty string enables the built-in mock data layer for local development and static demos.
 */
export const environment = {
  apiBaseUrl: '',
} as const;
