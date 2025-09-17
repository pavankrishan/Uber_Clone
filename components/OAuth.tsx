import { useOAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Alert, Image, Text, View } from "react-native";
import * as Linking from "expo-linking";

import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import React, { useCallback } from "react";
import { fetchAPI } from "@/lib/fetch";
import { tokenCache } from "@/lib/auth"; // your SecureStore wrapper

const OAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive, signUp } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/(root)/(tabs)/home"), // ✅ Works on native + web
      });

      if (createdSessionId && setActive) {
        // Activate Clerk session
        await setActive({ session: createdSessionId });

        // Store token securely (optional but recommended)
        await tokenCache.saveToken("sessionToken", createdSessionId);

        // Sync user with your backend (optional)
        if (signUp?.createdUserId) {
          try {
            await fetchAPI("/user", {
              method: "POST",
              body: JSON.stringify({
                name: `${signUp.firstName ?? ""} ${signUp.lastName ?? ""}`,
                email: signUp.emailAddress,
                clerkId: signUp.createdUserId,
              }),
            });
          } catch (apiErr) {
            console.warn("User sync failed:", apiErr);
          }
        }

        // Navigate user to home screen
        router.replace("/");
      } else {
        Alert.alert(
          "Login Incomplete",
          "Google Sign-In did not complete successfully."
        );
      }
    } catch (err) {
      console.error("Google OAuth Error:", err);
      Alert.alert("Login Failed", "Something went wrong during Google login.");
    }
  }, [startOAuthFlow]);

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-4 gap-x-3">
        <View className="flex-1 h-[1px] bg-general-100" />
        <Text className="text-lg">Or</Text>
        <View className="flex-1 h-[1px] bg-general-100" />
      </View>

      <CustomButton
        title="Log In with Google"
        className="mt-5 w-full shadow-none"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5 mx-2"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={handleGoogleSignIn}
      />
    </View>
  );
};

export default OAuth;
