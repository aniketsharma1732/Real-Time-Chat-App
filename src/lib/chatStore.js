import { create } from "zustand";
import { useUserStore } from "./userStore";
import { db } from "../lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

export const useChatStore = create((set, get) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,
  unsubscribes: [], // track multiple listeners

  changeChat: (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;

    if (!chatId || !user) {
      // cleanup if no chat selected
      get().unsubscribes.forEach((u) => u && u());
      set({
        chatId: null,
        user: null,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
        unsubscribes: [],
      });
      return;
    }

    // cleanup old listeners
    get().unsubscribes.forEach((u) => u && u());

    // Listen to target user's doc → to know if they block me
    const unsubTarget = onSnapshot(doc(db, "users", user.id), (docSnap) => {
      if (docSnap.exists()) {
        const targetUser = docSnap.data();
        const currentUser = useUserStore.getState().currentUser;

        const isCurrentUserBlocked = targetUser?.blocked?.includes(currentUser?.id);

        set((state) => ({
          ...state,
          user: { ...targetUser, id: user.id },
          isCurrentUserBlocked,
        }));
      }
    });

    // Listen to current user's doc → to know if I block them
    const unsubCurrent = onSnapshot(doc(db, "users", currentUser.id), (docSnap) => {
      if (docSnap.exists()) {
        const me = docSnap.data();
        const isReceiverBlocked = me?.blocked?.includes(user?.id);

        set((state) => ({
          ...state,
          isReceiverBlocked,
        }));
      }
    });

    set({
      chatId,
      user,
      unsubscribes: [unsubTarget, unsubCurrent],
    });
  },

  toggleBlock: async () => {
    const { user, isReceiverBlocked } = get();
    const currentUser = useUserStore.getState().currentUser;

    if (!user || !currentUser) return;

    const userRef = doc(db, "users", currentUser.id);

    try {
      if (isReceiverBlocked) {
        // unblock
        await updateDoc(userRef, {
          blocked: arrayRemove(user.id),
        });
      } else {
        // block
        await updateDoc(userRef, {
          blocked: arrayUnion(user.id),
        });
      }
    } catch (err) {
      console.error("Error updating block status: ", err);
    }
  },

  resetChat: () => {
    get().unsubscribes.forEach((u) => u && u());
    set({
      chatId: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
      unsubscribes: [],
    });
  },
}));
