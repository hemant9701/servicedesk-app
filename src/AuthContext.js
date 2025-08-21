import axios from "axios";
import React, { createContext, useState, useContext } from "react";
//import { fetchData } from './services/apiService';

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

  const login = async (token, email, password) => {
    try {
      if (!token || !email || !password) {
        throw new Error("All fields must be filled out.");
      }

      const authEmail = email.trim();
      const url = `https://testservicedeskapi.odysseemobile.com/api/Authentication/contact-authtoken/`;

      const data = {
        "useremail": email,
        "password": password,
        "access_token": token
      }

      const response = await axios.post(url, data);
      //const response = await fetchData(url, 'POST', data)

      //console.log(response.data);


      if (response) {
        const userName = response.data.firstname + ' ' + response.data.lastname;
        const userId = response.data.id;
        const userLang = response.data.db_language_iso_code;
        const authKey = response.data.auth_token;
        const authData = { authKey, userId, userName, authEmail, userLang };
        setAuth(authData);
        sessionStorage.setItem("auth", JSON.stringify(authData));
      }

      return response;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw new Error("Login failed. Please check your credentials.");
    }
  };

  const logout = () => {
    setAuth(null);
    sessionStorage.removeItem("auth");
  };

  const updateAuthToken = (newToken) => {
    setAuth(prev => ({
      ...prev,
      auth_token: newToken
    }));
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