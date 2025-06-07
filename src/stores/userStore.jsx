import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import supabase from "../api/supabase";
import { generateRandomUsername } from "../utils/username_generator";

const useUserStore = create((set, get) => ({
  userId: null,
  username: null,
  isInitialized: false,
  isLoading: false,

  // Initialize user from localStorage or create new user
  initializeUser: async () => {
    const { isInitialized, isLoading } = get();

    // Prevent multiple concurrent initializations
    if (isInitialized || isLoading) {
      return get().userId;
    }

    set({ isLoading: true });

    try {
      let userId = localStorage.getItem("user_id");
      let username = localStorage.getItem("username");

      if (!userId) {
        // Create new user
        userId = uuidv4();
        username = generateRandomUsername();

        localStorage.setItem("user_id", userId);
        localStorage.setItem("username", username);

        console.log("Creating new user with ID:", userId, "and username:", username);

        try {
          await supabase.from("users").insert({
            id: userId,
            username: username,
          });
        } catch (error) {
          console.error("Failed to create user:", error);
          // Don't throw here - allow app to continue with local user data
        }
      }

      set({
        userId,
        username,
        isInitialized: true,
        isLoading: false,
      });

      return userId;
    } catch (error) {
      console.error("Error initializing user:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Get user ID (initialize if needed)
  getUserId: async () => {
    const { userId, isInitialized } = get();

    if (isInitialized && userId) {
      return userId;
    }

    return await get().initializeUser();
  },

  // Clear user data (for logout, etc.)
  clearUser: () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    set({
      userId: null,
      username: null,
      isInitialized: false,
      isLoading: false,
    });
  },

  // Update username
  updateUsername: async (newUsername) => {
    const { userId } = get();

    if (!userId) {
      throw new Error("No user ID found");
    }

    try {
      await supabase.from("users").update({ username: newUsername }).eq("id", userId);

      localStorage.setItem("username", newUsername);
      set({ username: newUsername });
    } catch (error) {
      console.error("Failed to update username:", error);
      throw error;
    }
  },
}));

export default useUserStore;
