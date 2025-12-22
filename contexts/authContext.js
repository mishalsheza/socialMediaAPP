import { createContext, useContext, useState } from "react";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Set the full authenticated user (from Supabase + users table)
  const setAuth = (authUser) => {
    setUser({
      ...authUser,
      user_metadata: authUser.user_metadata || {},
    });
  };

  // Update only the metadata (e.g., after EditProfile)
  const setUserData = ({ name, phoneNumber, bio, address, image }) => {
    setUser((prev) => ({
      ...prev,
      user_metadata: {
        ...prev.user_metadata,
        full_name: name,
        phone_number: phoneNumber,
        bio,
        address,
        image,
      },
    }));
  };

  return (
    <AuthContext.Provider value={{ user, setAuth, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);