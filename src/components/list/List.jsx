import "./list.css";
import Userinfo from "./userInfo/Userinfo";
import ChatList from "./chatList/ChatList";

const List = ({ setActiveSection }) => {
    return (
        <div className="list">
            <Userinfo />
            <ChatList setActiveSection={setActiveSection} />
        </div>
    );
};

export default List;
