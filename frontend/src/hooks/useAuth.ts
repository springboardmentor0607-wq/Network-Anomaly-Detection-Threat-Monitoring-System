"use client";

import { useState, useEffect } from "react";

export type Role = "analyst" | "admin";

export function useAuth() {
  const [role, setRoleState] = useState<Role>("analyst");
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticatedState] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedRole = localStorage.getItem("netshield_role") as Role | null;
    const storedAuth = localStorage.getItem("netshield_auth");
    
    if (storedRole) {
      setRoleState(storedRole);
    }
    if (storedAuth === "true") {
      setIsAuthenticatedState(true);
    }
  }, []);

  const login = (newRole: Role) => {
    localStorage.setItem("netshield_role", newRole);
    localStorage.setItem("netshield_auth", "true");
    setRoleState(newRole);
    setIsAuthenticatedState(true);
  };

  const logout = () => {
    localStorage.removeItem("netshield_auth");
    setIsAuthenticatedState(false);
  };

  const setRole = (newRole: Role) => {
    localStorage.setItem("netshield_role", newRole);
    setRoleState(newRole);
  };

  return { role, setRole, login, logout, isAuthenticated, isMounted };
}
