import { ScrollViewStyleReset } from "expo-router/html";
import React from "react";

// Adds viewport-fit=cover so mobile Safari exposes safe-area-inset-* CSS vars,
// which react-native-safe-area-context uses for insets.top / insets.bottom.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
