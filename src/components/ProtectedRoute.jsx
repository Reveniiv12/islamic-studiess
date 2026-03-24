// src/components/ProtectedRoute.jsx
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import AccessDenied from "../pages/AccessDenied";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <p>جاري التحميل...</p>;
  if (!user) return <AccessDenied />;
  
  return children;
}
