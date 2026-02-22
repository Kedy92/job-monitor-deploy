import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMe } from "../api/users";
import { getToken, clearToken } from "../services/token";

export default function ProtectedRoute({ children }) {
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    async function validate() {
      const token = getToken();

      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        await getMe();
        setIsValid(true);
      } catch (err) {
        clearToken();
        setIsValid(false);
      }
    }

    validate();
  }, []);

  if (isValid === null) {
    return <div className="p-8 text-white">Validating session...</div>;
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
