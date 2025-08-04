import "./addUser.css";
import { db } from "../../../../lib/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { useState, useRef, useEffect } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = ({ onClose }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const { currentUser } = useUserStore();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus(); // Auto-focus input when component mounts
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty && querySnapShot.docs.length > 0) {
        const foundUser = {
          ...querySnapShot.docs[0].data(),
          id: querySnapShot.docs[0].id,
        };
        setUser(foundUser);
        setError("");
      } else {
        setUser(null);
        setError("No user found with this username.");
      }
    } catch (err) {
      console.error("Error during search:", err);
      setError("Something went wrong. Try again.");
    }
  };

  const handleAdd = async () => {
    if (!user) return;

    const userchatsRef = collection(db, "userchats");

    try {
      const currentUserChatsDoc = await getDocs(
        query(userchatsRef, where("__name__", "==", currentUser.id))
      );

      if (!currentUserChatsDoc.empty) {
        const currentUserChats = currentUserChatsDoc.docs[0].data().chats || [];

        const chatExists = currentUserChats.some(
          (chat) => chat.receiverId === user.id
        );

        if (chatExists) {
          setUser(null);
          setError("You have already added this user.");
          return;
        }
      }

      const chatRef = collection(db, "chats");
      const newChatRef = doc(chatRef);

      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      await updateDoc(doc(userchatsRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updateAt: Date.now(),
        }),
      });

      await updateDoc(doc(userchatsRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updateAt: Date.now(),
        }),
      });

      console.log("Chat added successfully.");
      setUser(null);
      onClose(); // Automatically close the form
    } catch (err) {
      console.error("Error adding chat:", err);
      setError("Failed to add user. Try again.");
    }
  };

  return (
    <div className="addUser">
      {!error && (
        <>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="username"
              name="username"
              ref={inputRef} // Auto-focus here
            />
            <div className="button-group">
              <button type="submit">Search</button>
              <button type="button" onClick={onClose} className="cancelBtn">
                Cancel
              </button>
            </div>
          </form>

          {user && (
            <div className="user">
              <div className="detail">
                <img src={user.avatar || "./avatar.png"} alt="" />
                <span>{user.username}</span>
              </div>
              <button onClick={handleAdd}>Add User</button>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="popup">
          <div className="popup-content">
            <p>{error}</p>
            <button onClick={() => setError("")}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUser;
