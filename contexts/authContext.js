import { createContext, useContext, useState } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Set the full authenticated user (from Supabase + users table)
  const setAuth = async (authUser) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data) {
        setUser({
          ...authUser,
          user_metadata: {
            ...authUser.user_metadata,
            full_name: data.name,
            phone_number: data.phoneNumber,
            bio: data.bio,
            address: data.address,
            image: data.image,
          },
        });
      } else {
        setUser(authUser);
      }
    } catch (error) {
       console.log('Error fetching user data: ', error);
       setUser(authUser);
    }
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