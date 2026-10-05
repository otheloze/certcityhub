import type { ConfigContext, ExpoConfig } from "expo/config";

import baseConfig from "./app.json";

// API base URL, mirroring apps/web's NEXT_PUBLIC_API_URL pattern but for
// Expo (EXPO_PUBLIC_* is inlined at build time, same idea).
//
// Defaults are chosen per target, since "localhost" means something
// different on each:
//  - iOS simulator: the simulator shares the Mac's network namespace, so
//    localhost:3001 reaches a locally running apps/api directly.
//  - Android emulator: the emulator is its own virtual machine: it must use
//    10.0.2.2 (the emulator's alias for the host machine's localhost).
//  - Physical device via Expo Go: neither works - use the dev machine's LAN
//    IP (e.g. http://192.168.1.23:3001/api) via EXPO_PUBLIC_API_URL.
function defaultApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  return "http://localhost:3001/api";
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(baseConfig.expo as ExpoConfig),
  ...config,
  extra: {
    apiUrl: defaultApiUrl(),
  },
});
