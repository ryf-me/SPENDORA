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
} from "firebase/auth";
import { db, storage } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
              notifications: {
                email: true,
                push: false,
                inApp: true,
                earlyWarning: "3",
                paymentDay: "due",
              },
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

  const updateUserProfile = async ({ name, bio, photoURL, avatarFile, notifications }: { name: string; bio?: string; photoURL?: string; avatarFile?: File; notifications?: { email?: boolean; push?: boolean; inApp?: boolean; earlyWarning?: string; paymentDay?: string; } }) => {
    const user = auth.currentUser;
    if (!user) {
      console.error("Update failed: No user found in auth.currentUser");
      throw new Error("No user logged in");
    }

    let finalPhotoURL = photoURL || user.photoURL;

    // Handle avatar upload (if still used elsewhere)
    if (avatarFile) {
      try {
        // Use a timestamp to prevent cache issues and identify unique uploads
        const timestamp = Date.now();
        const storageRef = ref(storage, `avatars/${user.uid}_${timestamp}`);

        await uploadBytes(storageRef, avatarFile);

        photoURL = await getDownloadURL(storageRef);
      } catch (uploadErr: any) {
        console.error("Storage Error during upload/URL fetch:", uploadErr);
        throw new Error(`Failed to upload image: ${uploadErr.message || "Unknown storage error"}`);
      }
    }

    // Update Firebase Auth
    try {
      await updateProfile(user, {
        displayName: name,
        photoURL: finalPhotoURL || undefined
      });
    } catch (authErr: any) {
      console.error("Auth Profile Update Error:", authErr);
      throw new Error(`Failed to update Auth name/photo: ${authErr.message}`);
    }

    // Update Firestore
    try {
      const userRef = doc(db, "users", user.uid);
      const updateData: any = {
        name,
        bio: bio || "",
        photoURL: finalPhotoURL || null,
        updatedAt: serverTimestamp(),
      };

      if (notifications) {
        updateData.notifications = {
          email: notifications.email ?? true,
          push: notifications.push ?? false,
          inApp: notifications.inApp ?? true,
          earlyWarning: notifications.earlyWarning ?? "3",
          paymentDay: notifications.paymentDay ?? "due",
        };
      }

      await setDoc(userRef, updateData, { merge: true });

      // Update local state
      setProfileData((prev: any) => ({ ...prev, ...updateData }));
    } catch (fsErr: any) {
      console.error("Firestore Update Error:", fsErr);
    }

    // Force refresh local user object
    try {
      await user.reload();
      setCurrentUser({ ...auth.currentUser });
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
