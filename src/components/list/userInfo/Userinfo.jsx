import "./userInfo.css";
import { useUserStore } from "../../../lib/userStore";
import { auth } from "../../../lib/firebase";

const Userinfo = () => {
  const { currentUser } = useUserStore();

  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser.avatar || "./avatar.png"} alt="" />
        <h2>{currentUser.username}</h2>
      </div>

      <button className="logout" onClick={() => auth.signOut()}>
        <img src="./logout.png"  alt="Logout" />
      </button>
    </div>
  );
};

export default Userinfo;
