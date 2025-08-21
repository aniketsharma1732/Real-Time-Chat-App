import { useLayoutEffect, useRef, useState, useEffect } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
    onSnapshot,
    doc,
    updateDoc,
    getDoc,
    arrayUnion,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";

const Chat = ({ setActiveSection }) => {
    const [chat, setChat] = useState(null);
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const { chatId, user } = useChatStore();
    const { currentUser } = useUserStore();
    const [img, setImg] = useState({ file: null, url: "" });
    const endRef = useRef(null);
    const [zoomedImage, setZoomedImage] = useState(null);

    // 🔴 local block states that will be updated in real-time
    const [isCurrentUserBlocked, setIsCurrentUserBlocked] = useState(false);
    const [isReceiverBlocked, setIsReceiverBlocked] = useState(false);

    // 🔴 Real-time listener for block changes
    useEffect(() => {
        if (!currentUser || !user) return;

        const unsub = onSnapshot(doc(db, "users", currentUser.id), (docSnap) => {
            if (docSnap.exists()) {
                const blocked = docSnap.data().blocked || [];
                setIsReceiverBlocked(blocked.includes(user.id));
            }
        });

        const unsubOther = onSnapshot(doc(db, "users", user.id), (docSnap) => {
            if (docSnap.exists()) {
                const blocked = docSnap.data().blocked || [];
                setIsCurrentUserBlocked(blocked.includes(currentUser.id));
            }
        });

        return () => {
            unsub();
            unsubOther();
        };
    }, [currentUser, user]);

    useEffect(() => {
        if (!chatId) return;

        const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
            setChat(res.data());
        });

        return () => unSub();
    }, [chatId]);

    useLayoutEffect(() => {
        if (chat?.messages?.length > 0) {
            endRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chat?.messages?.length]);

    const handleEmoji = (e) => {
        setText((prev) => prev + e.emoji);
        setOpen(false);
    };

    const handleImg = (e) => {
        if (e.target.files[0]) {
            setImg({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0]),
            });
        }
    };

    const handleSend = async () => {
        if (text.trim() === "" || isCurrentUserBlocked || isReceiverBlocked) return;

        let imgUrl = null;

        try {
            if (img.file) {
                imgUrl = await upload(img.file);
            }

            const newMessage = {
                senderId: currentUser.id,
                text,
                createdAt: new Date(),
                ...(imgUrl && { img: imgUrl }),
            };

            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayUnion(newMessage),
            });

            const userIDs = [currentUser.id, user.id];

            userIDs.forEach(async (id) => {
                const userChatsRef = doc(db, "userchats", id);
                const userChatsSnapshot = await getDoc(userChatsRef);

                if (userChatsSnapshot.exists()) {
                    const userChatsData = userChatsSnapshot.data();
                    const chatIndex = userChatsData.chats.findIndex(c => c.chatId === chatId);
                    if (chatIndex !== -1) {
                        userChatsData.chats[chatIndex].lastMessage = text;
                        userChatsData.chats[chatIndex].isSeen = id === currentUser.id;
                        userChatsData.chats[chatIndex].updatedAt = Date.now();

                        await updateDoc(userChatsRef, {
                            chats: userChatsData.chats,
                        });
                    }
                }
            });

            setText("");
            setImg({ file: null, url: "" });
        } catch (err) {
            console.log("Error sending message:", err);
        }
    };

    return (
        <div className="chat">
            <div className="top">
                <div className="user" onClick={() => {
                    if (window.innerWidth <= 768 && setActiveSection) {
                        setActiveSection("detail");
                    }
                }}
                    style={{ cursor: window.innerWidth <= 768 ? "pointer" : "default" }}>
                    <img src={user?.avatar || "./avatar.png"} alt="" />
                    <div className="texts">
                        <span>{user?.username}</span>
                        <p>click here for more</p>
                    </div>
                </div>
                <button
                    className="backButton"
                    onClick={() => {
                        if (window.innerWidth <= 768 && setActiveSection) {
                            setActiveSection("chatList");
                        }
                    }}
                    style={{ display: window.innerWidth <= 768 ? 'inline-block' : 'none' }}
                >
                    ←
                </button>
            </div>

            <div className="center">
                {chat?.messages?.map((message, index) => (
                    <div
                        className={message.senderId === currentUser.id ? "message own" : "message"}
                        key={message.createdAt?.toString() || index}
                    >
                        <div className="texts">
                            {message.img && (
                                <img
                                    src={message.img}
                                    alt="msg media"
                                    onClick={() => setZoomedImage(message.img)}
                                    className="messageImage"
                                />
                            )}
                            <p>{message.text}</p>
                        </div>
                    </div>
                ))}
                {img.url && (
                    <div className="message own uploading">
                        <div className="texts">
                            <img src={img.url} alt="preview" />
                        </div>
                    </div>
                )}
                <div ref={endRef}></div>
            </div>

            <div className="bottom">
                <input
                    type="text"
                    placeholder={isCurrentUserBlocked || isReceiverBlocked ? "you cannot send a message" : "Type a message..."}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !isCurrentUserBlocked && !isReceiverBlocked) {
                            handleSend();
                        }
                    }}
                    disabled={isCurrentUserBlocked || isReceiverBlocked}
                />
                <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>
                    Send
                </button>
            </div>

            {zoomedImage && (
                <div className="imageModal">
                    <span className="closeBtn" onClick={() => setZoomedImage(null)}>×</span>
                    <img src={zoomedImage} alt="Zoomed" />
                </div>
            )}
        </div>
    );
};

export default Chat;
