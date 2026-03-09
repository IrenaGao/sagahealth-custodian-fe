import { Platform } from "react-native";

/**
 * True only when running inside the desktop web iframe (MobileWebFrame).
 * On mobile Safari / other mobile browsers this is false.
 */
export const isDesktopWebFrame =
  Platform.OS === "web" &&
  typeof window !== "undefined" &&
  window.self !== window.top;

/**
 * Extra top inset for web contexts.
 * Desktop iframe needs 67px to clear the content area.
 * Mobile Safari relies on insets.top from safe-area-context (viewport-fit=cover),
 * with a small fallback in case it returns 0.
 */
export const webTopInsetBase = isDesktopWebFrame ? 67 : 8;

/**
 * Bottom scroll padding for web — enough to clear the 84px tab bar + home indicator.
 */
export const webBottomPadding = isDesktopWebFrame ? 34 + 84 : 84 + 24;
