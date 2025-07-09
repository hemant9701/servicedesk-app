import axios from "axios";
import React, { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    try {
      const storedAuth = sessionStorage.getItem("auth");
      return storedAuth ? JSON.parse(storedAuth) : null;
    } catch (error) {
      console.error("Failed to parse auth data from session storage:", error);
      return null;
    }
  });

  const login = async (domain, email, password) => {
    try {
      if (!domain || !email || !password) {
        throw new Error("All fields must be filled out.");
      }

      const authString = `${email.trim()}:${password.trim()}@${domain.trim()}`;
      const authKey = btoa(authString);
      const authEmail = email.trim();

      const url = `https://V1servicedeskapi.wello.solutions/api/Contact?$filter=e_login+eq+'${encodeURIComponent(email)}'`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${authKey}`,
          Accept: "application/json",
        },
      });
      
      if (response.data) {
        const userName = response.data.value[0].firstname+' '+response.data.value[0].lastname;
        const userId = response.data.value[0].id;
        const userLang = response.data.value[0].db_language_iso_code;
        const authData = { authKey, userId, userName, authEmail, userLang };
        setAuth(authData);
        sessionStorage.setItem("auth", JSON.stringify(authData));
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw new Error("Login failed. Please check your credentials.");
    }
  };

  const logout = () => {
    setAuth(null);
    sessionStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
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