import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import "./detail.css";

const Detail = ({ setActiveSection }) => {
  const { user, isReceiverBlocked, toggleBlock } = useChatStore();
  const { currentUser } = useUserStore();

  const handleBlock = async () => {
    if (!user || !currentUser) return;
    await toggleBlock(); // uses Firestore + real-time sync from chatStore
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
        <p>{user?.username} and you are talking through a secured connection</p>
      </div>

      <div className="info">
        <button onClick={handleBlock}>
          {isReceiverBlocked ? "Unblock User" : "Block User"}
        </button>
      </div>
    </div>
  );
};

export default Detail;
