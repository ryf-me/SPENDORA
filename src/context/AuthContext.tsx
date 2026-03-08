import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import { db, storage } from "../firebase";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface AuthContextType {
  currentUser: any;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: { name: string; bio?: string; avatarFile?: File }) => Promise<void>;
  profileData: any;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for preview when Firebase config is dummy
const MOCK_USER = {
  uid: "mock-123",
  email: "janice@expensio.com",
  displayName: "Janice Chandler",
  photoURL: "https://i.pravatar.cc/150?u=janice",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Sync user profile to Firestore
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            const initialData = {
              name: user.displayName || user.email?.split("@")[0] || "User",
              email: user.email,
              createdAt: serverTimestamp(),
              currency: "LKR",
            };
            await setDoc(userRef, initialData);
            setProfileData(initialData);
          } else {
            setProfileData(userSnap.data());
          }
        } else {
          setProfileData(null);
        }
      } catch (err) {
        console.error("Error syncing user profile:", err);
      } finally {
        setCurrentUser(user);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      await updateProfile(res.user, { displayName: name });
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const updateUserProfile = async ({ name, bio, photoURL, avatarFile }: { name: string; bio?: string; photoURL?: string; avatarFile?: File }) => {
    console.log("Starting profile update...");
    const user = auth.currentUser;
    if (!user) {
      console.error("Update failed: No user found in auth.currentUser");
      throw new Error("No user logged in");
    }

    let finalPhotoURL = photoURL || user.photoURL;

    // Handle avatar upload (if still used elsewhere)
    if (avatarFile) {
      console.log("File detected, starting upload to storage...", avatarFile.name);
      try {
        // Use a timestamp to prevent cache issues and identify unique uploads
        const timestamp = Date.now();
        const storageRef = ref(storage, `avatars/${user.uid}_${timestamp}`);

        console.log("Uploading bytes...");
        const uploadResult = await uploadBytes(storageRef, avatarFile);
        console.log("Upload successful, fetching download URL...", uploadResult.metadata.fullPath);

        photoURL = await getDownloadURL(storageRef);
        console.log("New photoURL obtained:", photoURL);
      } catch (uploadErr: any) {
        console.error("Storage Error during upload/URL fetch:", uploadErr);
        throw new Error(`Failed to upload image: ${uploadErr.message || "Unknown storage error"}`);
      }
    }

    // Update Firebase Auth
    console.log("Updating Firebase Auth profile with name:", name);
    try {
      await updateProfile(user, {
        displayName: name,
        photoURL: finalPhotoURL || undefined
      });
      console.log("Firebase Auth profile updated successfully");
    } catch (authErr: any) {
      console.error("Auth Profile Update Error:", authErr);
      throw new Error(`Failed to update Auth name/photo: ${authErr.message}`);
    }

    // Update Firestore
    console.log("Updating user doc in Firestore...");
    try {
      const userRef = doc(db, "users", user.uid);
      const updateData = {
        name,
        bio: bio || "",
        photoURL: finalPhotoURL || null,
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, updateData, { merge: true });
      console.log("Firestore document updated successfully");

      // Update local state
      setProfileData((prev: any) => ({ ...prev, ...updateData }));
    } catch (fsErr: any) {
      console.error("Firestore Update Error:", fsErr);
    }

    // Force refresh local user object
    console.log("Reloading user account to sync changes...");
    try {
      await user.reload();
      setCurrentUser({ ...auth.currentUser });
      console.log("User reloaded. Update complete.");
    } catch (reloadErr) {
      console.warn("Reload failed, but changes were saved.", reloadErr);
      setCurrentUser({ ...auth.currentUser });
    }
  };

  const value = {
    currentUser,
    profileData,
    loading,
    login,
    register,
    resetPassword,
    loginWithGoogle,
    logout,
    updateUserProfile,
    isMock: false,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
