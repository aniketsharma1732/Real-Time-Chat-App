import { useEffect, useState } from "react";
import Chat from "./components/chats/Chat";
import Detail from "./components/details/Detail";
import List from "./components/list/List";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const [activeSection, setActiveSection] = useState("chatList");

  // Fetch user info on auth state change
  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });
    return () => unSub();
  }, [fetchUserInfo]);

  // Toggle body background for mobile chat view
  useEffect(() => {
    if (window.innerWidth <= 768) {
      if (chatId) {
        document.body.classList.add("chat-open-mobile");
      } else {
        document.body.classList.remove("chat-open-mobile");
      }
    }
  }, [chatId]);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className={`container ${chatId ? "chat-active" : ""}`}>
      {currentUser ? (
        <>
          {(activeSection === "chatList" || window.innerWidth > 768) && (
            <List setActiveSection={setActiveSection} />
          )}
          {(activeSection === "chat" || window.innerWidth > 768) && chatId && (
            <Chat setActiveSection={setActiveSection} />
          )}
          {chatId && (window.innerWidth > 768 || activeSection === "detail") && (
            <Detail setActiveSection={setActiveSection} />
          )}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;
