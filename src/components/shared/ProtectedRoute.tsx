import { useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  role?: "admin" | "team" | "client";
}

const ProtectedRoute = ({ children, role = "admin" }: ProtectedRouteProps) => {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const loginRoutes = {
        admin: "/admin/login",
        team: "/team/login",
        client: "/client/login"
      };

      const redirectPath = loginRoutes[role] || "/";

      const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
      const userRole = localStorage.getItem("userRole");

      if (!isAuthenticated) {
        navigate(redirectPath);
        return;
      }

      if (userRole !== role) {
        // Allow supervisor to access team routes
        if (!(role === "team" && userRole === "supervisor")) {
          navigate(redirectPath);
          return;
        }
      }

      setAuthorized(true);
    };

    checkAuth();
  }, [navigate, role]);

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
