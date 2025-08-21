import { useState } from "react";
import "./login.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { deleteUser } from "firebase/auth";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, runTransaction } from "firebase/firestore";

import { auth, db } from "../../lib/firebase";
import upload from "../../lib/upload";
import { useUserStore } from "../../lib/userStore";

// ✅ Email validation function
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ✅ Transaction to safely reserve username
const reserveUsername = async (username, uid) => {
  if (!username) throw new Error("Username is required");
  const usernameRef = doc(db, "usernames", username);

  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(usernameRef);
    if (docSnap.exists()) {
      throw new Error("Username already taken!");
    }
    transaction.set(usernameRef, { uid });
  });
};

const Login = () => {
  const [avatar, setAvatar] = useState({ file: null, url: "" });
  const [loading, setLoading] = useState(false);

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  // ✅ Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { loginEmail, loginPassword } = Object.fromEntries(formData);

    if (!loginEmail || !loginPassword) {
      toast.error("Please enter both email and password.");
      setLoading(false);
      return;
    }

    if (!isValidEmail(loginEmail)) {
      toast.error("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);

      // Reset old user & chat state before fetching new one
      const { fetchUserInfo, resetUser } = useUserStore.getState();
      resetUser();
      await fetchUserInfo(auth.currentUser.uid);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Register handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { signupUsername, signupEmail, signupPassword } = Object.fromEntries(formData);

    if (!signupUsername || !signupEmail || !signupPassword) {
      toast.error("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (!isValidEmail(signupEmail)) {
      toast.error("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    let userCredential;

    try {
      // Step 1: Create Firebase Auth user
      userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);

      // Step 2: Try to reserve the username
      await reserveUsername(signupUsername, userCredential.user.uid);

      // Step 3: Upload avatar if provided
      const imgUrl = avatar.file ? await upload(avatar.file) : "";

      // Step 4: Save user profile
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: signupUsername,
        email: signupEmail,
        avatar: imgUrl,
        id: userCredential.user.uid,
        blocked: [],
      });

      // Step 5: Initialize empty chat list
      await setDoc(doc(db, "userchats", userCredential.user.uid), { chats: [] });

      // Step 6: Fetch user info for local store
      const { fetchUserInfo } = useUserStore.getState();
      await fetchUserInfo(userCredential.user.uid);

      toast.success("Account created successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "An error occurred during registration.");

      // If username reservation fails, remove the Auth account
      if (userCredential?.user) {
        try {
          await deleteUser(userCredential.user);
        } catch (deleteErr) {
          console.error("Error deleting user:", deleteErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      {/* Login Section */}
      <div className="item">
        <h2>Welcome Back</h2>
        <form onSubmit={handleLogin} autoComplete="off">
          <input 
            type="email" 
            placeholder="Email" 
            name="loginEmail" 
            autoComplete="new-email" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            name="loginPassword" 
            autoComplete="new-password" 
          />
          <button disabled={loading}>
            {loading ? "Loading..." : "Sign In"}
          </button>
        </form>
      </div>

      <div className="separator"></div>

      {/* Register Section */}
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister} autoComplete="off">
          {/* Profile Image Upload */}
          <label htmlFor="file" className="avatarLabel">
            <img 
              src={avatar.url || "./avatar.png"} 
              alt="Avatar" 
              className="avatarPreview" 
            />
            <span>upload an image</span>
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleAvatar}
          />

          <input 
            type="text" 
            placeholder="Username" 
            name="signupUsername" 
            autoComplete="new-username" 
          />
          <input 
            type="email" 
            placeholder="Email" 
            name="signupEmail" 
            autoComplete="new-email" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            name="signupPassword" 
            autoComplete="new-password" 
          />
          <button disabled={loading}>
            {loading ? "Loading..." : "Sign Up"}
          </button>
        </form>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Login;
