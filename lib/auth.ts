import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as AuthSession from "expo-auth-session";
import { router } from "expo-router";

import { fetchAPI } from "@/lib/fetch";

export const tokenCache = {
  async getToken(key: string) {
    try {
      // Get token from secure storage
      const token = await SecureStore.getItemAsync(key);
      return token;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },

  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("SecureStore save error: ", err);
    }
  },

  async deleteToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.error("SecureStore delete error: ", err);
    }
  },
};

export const googleOAuth = async (startOAuthFlow: any) => {
  try {
    const { createdSessionId, setActive, signUp } = await startOAuthFlow({
      redirectUrl: Linking.createURL("/(root)/(tabs)/home"), // Adjust for expo-router
    });

    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });

      // ✅ Save session token securely
      await tokenCache.saveToken("sessionToken", createdSessionId);

      // ✅ Sync user data with your API
      if (signUp?.createdUserId) {
        try {
          await fetchAPI("/user", {
            method: "POST",
            body: JSON.stringify({
              name: `${signUp.firstName} ${signUp.lastName}`,
              email: signUp.emailAddress,
              clerkId: signUp.createdUserId,
            }),
          });
        } catch (apiError) {
          console.warn("User sync failed:", apiError);
        }
      }

      // ✅ Navigate to home after successful login
      router.push("/");

      return {
        success: true,
        code: "success",
        message: "You have successfully signed in with Google",
      };
    }

    return {
      success: false,
      message: "An error occurred while signing in with Google",
    };
  } catch (err: any) {
    console.error("Google OAuth error:", err);
    return {
      success: false,
      code: err?.code || "OAUTH_ERROR",
      message: err?.errors?.[0]?.longMessage || "Failed to sign in with Google",
    };
  }
};
