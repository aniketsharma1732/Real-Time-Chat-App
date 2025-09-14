import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a file to Firebase Storage and returns its download URL.
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} - Resolves with the download URL of the uploaded file.
 */
const upload = (file) => {
  if (!file) return Promise.reject("No file provided");

  const timestamp = new Date().toISOString();
  const storageRef = ref(storage, `images/${timestamp}_${file.name}`);
  const metadata = { contentType: file.type };

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    console.log(`[Upload] Starting file upload: ${file.name}`);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = ((snapshot.bytesTransferred / snapshot.totalBytes) * 100).toFixed(2);
        console.log(`[Upload] Progress: ${progress}%`);
      },
      (error) => {
        console.error("[Upload] Error:", error);
        reject(`Upload failed: ${error.code || error.message}`);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("[Upload] File available at:", downloadURL);
          resolve(downloadURL);
        } catch (err) {
          console.error("[Upload] Error getting download URL:", err);
          reject(`Failed to get download URL: ${err.code || err.message}`);
        }
      }
    );
  });
};

export default upload;
