import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./detail.css";

const Detail = ({ setActiveSection }) => {
  const {
    chatId,
    user,
    isCurrentUserBlocked,
    isReceiverBlocked,
    changeBlock,
  } = useChatStore();
  const { currentUser } = useUserStore();

  const handleBlock = async () => {
  if (!user) return;

  const currentUserRef = doc(db, "users", currentUser.id);
  const receiverRef = doc(db, "users", user.id);

  try {
    if (isReceiverBlocked) {
      // 🔓 Unblock: remove currentUser from receiver's blockedBy
      await updateDoc(currentUserRef, {
        blocked: arrayRemove(user.id),
      });
      await updateDoc(receiverRef, {
        blockedBy: arrayRemove(currentUser.id), // optional, if you're using a separate array
      });
    } else {
      // 🔒 Block: add currentUser to receiver's blockedBy
      await updateDoc(currentUserRef, {
        blocked: arrayUnion(user.id),
      });
      await updateDoc(receiverRef, {
        blockedBy: arrayUnion(currentUser.id), // optional, if you're using a separate array
      });
    }

    changeBlock();
  } catch (err) {
    console.log(err);
  }
};


  return (
    <div className="detail">
      {/* Back Button for Mobile */}
      {window.innerWidth <= 768 && (
        <button
          className="back-button"
          onClick={() => setActiveSection("chat")}
        >
          ← 
        </button>
      )}

      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="" />
        <h2>{user?.username}</h2>
        <p>
          {user?.username} and you are talking through a secured connection
        </p>
      </div>

      <div className="info">
        <button onClick={handleBlock}>
          {isCurrentUserBlocked
            ? "You are blocked"
            : isReceiverBlocked
            ? "Unblock user"
            : "Block User"}
        </button>

        
      </div>
    </div>
  );
};

export default Detail;