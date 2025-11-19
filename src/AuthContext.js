import axios from "axios";
import { createContext, useState, useContext, useEffect } from "react";

const baseUrl = process.env.REACT_APP_API_URL || 'https://servicedeskapi.odysseemobile.com';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    try {
      const storedAuth = localStorage.getItem("auth");
      return storedAuth ? JSON.parse(storedAuth) : null;
    } catch (error) {
      console.error("Failed to parse auth data from local storage:", error);
      return null;
    }
  });

  // Sync logout across tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "auth" && event.newValue === null) {
        setAuth(null);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (token, email, password) => {
    try {
      if (!token) throw new Error("Your access token is not set.");
      if (!email || !password) throw new Error("All fields must be filled out.");

      const authEmail = email.trim();
      const url = `${baseUrl.replace(/\/$/, '')}/api/Authentication/contact-authtoken/`;
      const data = { useremail: email, password, access_token: token };

      const response = await axios.post(url, data);

      if (response?.data) {
        const { firstname, lastname, id, db_language_iso_code, auth_token } = response.data;
        const authData = {
          authKey: auth_token,
          userId: id,
          userName: `${firstname} ${lastname}`,
          authEmail,
          userLang: db_language_iso_code
        };
        setAuth(authData);
        localStorage.setItem("auth", JSON.stringify(authData)); // ✅ use localStorage
      }

      return response;
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Login failed. Please check your credentials.";
      throw new Error(apiMessage);
    }
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("auth"); // ✅ use localStorage
  };

  const updateAuthToken = (newToken) => {
    setAuth(prev => {
      const updated = { ...prev, authKey: newToken };
      localStorage.setItem("auth", JSON.stringify(updated)); // ✅ persist update
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, updateAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};