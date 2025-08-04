import { create } from 'zustand';
import { db } from "./firebase";
import { doc, getDoc } from 'firebase/firestore';
import { useUserStore } from './userStore';

export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  changeChat: (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;

    // 🔒 Safe checks to avoid "includes of undefined" error
    const isCurrentUserBlocked = user?.blocked?.includes(currentUser.id);
    const isReceiverBlocked = currentUser?.blocked?.includes(user?.id);

    if (isCurrentUserBlocked) {
      return set({
        chatId,
        user: null,
        isCurrentUserBlocked: true,
        isReceiverBlocked: false,
      });
    } else if (isReceiverBlocked) {
      return set({
        chatId,
        user: null,
        isCurrentUserBlocked: false,
        isReceiverBlocked: true,
      });
    } else {
      return set({
        chatId,
        user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    }
  },

  changeBlock: () => {
    set((state) => ({
      ...state,
      isReceiverBlocked: !state.isReceiverBlocked
    }));
  }
}));
