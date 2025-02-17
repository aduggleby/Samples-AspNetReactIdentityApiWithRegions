import React, { createContext, useContext, useState, useEffect } from "react";
import AuthService from "../services/AuthService";

interface Result<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean | null;
  user: any;
  login: (
    email: string,
    password: string,
    remember: boolean
  ) => Promise<Result<any>>;
  register: (email: string, password: string) => Promise<Result<any>>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  const checkAuthentication = async () => {
    const result = await AuthService.retryableGetUser();
    if (result.success) {
      setIsAuthenticated(true);
      setUser(result.data);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const login = async (
    email: string,
    password: string,
    remember: boolean
  ): Promise<Result<any>> => {
    const result = await AuthService.login(email, password, remember);
    if (result.success) {
      await checkAuthentication();
    }
    return result;
  };

  const register = async (
    email: string,
    password: string
  ): Promise<Result<any>> => {
    const result = await AuthService.register(email, password);
    if (result.success) {
      await checkAuthentication();
    }
    return result;
  };

  const logout = async () => {
    await AuthService.logout();
    await checkAuthentication();
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
