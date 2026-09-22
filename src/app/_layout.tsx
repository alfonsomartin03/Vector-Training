import { Stack } from "expo-router";

import { AuthGate } from "../components/AuthGate";
import { PrivacyConsent } from "../components/PrivacyConsent";
import { Seo } from "../components/Seo";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <>
      <Seo />
      <AuthProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }} />
          <PrivacyConsent />
        </AuthGate>
      </AuthProvider>
    </>
  );
}
