/// <reference types="vite/client" />

/** Respect the hosting subdirectory; Node-based tests use the root default. */
export function assetUrl(path: string): string {
  return `${import.meta.env?.BASE_URL ?? '/'}${path.replace(/^\/+/, '')}`;
}
