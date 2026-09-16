import { Stack } from "expo-router";

import { AuthGate } from "../components/AuthGate";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </AuthGate>
    </AuthProvider>
  );
}