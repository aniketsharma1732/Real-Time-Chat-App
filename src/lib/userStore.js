import { create } from "zustand";
import { db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useChatStore } from "./chatStore";

let unsubscribeUser = null; // keep track of Firestore listener

export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,

  fetchUserInfo: (uid) => {
    if (!uid) {
      set({ currentUser: null, isLoading: false });
      return;
    }

    // If already listening, stop old listener
    if (unsubscribeUser) {
      unsubscribeUser();
      unsubscribeUser = null;
    }

    try {
      const docRef = doc(db, "users", uid);

      // Real-time listener
      unsubscribeUser = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          set({ currentUser: docSnap.data(), isLoading: false });
        } else {
          set({ currentUser: null, isLoading: false });
        }
      });
    } catch (err) {
      console.log(err);
      set({ currentUser: null, isLoading: false });
    }
  },

  resetUser: () => {
    // Stop Firestore listener
    if (unsubscribeUser) {
      unsubscribeUser();
      unsubscribeUser = null;
    }

    // Reset user
    set({ currentUser: null, isLoading: false });

    // Reset chat store completely
    const { resetChat } = useChatStore.getState();
    if (resetChat) resetChat();
  },
}));
