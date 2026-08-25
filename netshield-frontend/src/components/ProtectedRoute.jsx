import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole, allowedRoles }) {
  const userJson = localStorage.getItem("netshield_user");

  if (!userJson) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userJson);
    if (!user || !user.email) {
      return <Navigate to="/login" replace />;
    }

    const userRole = user.role || "Security Analyst";
    const isAdmin =
      userRole === "Security Administrator" ||
      userRole === "Admin" ||
      userRole === "admin";

    // Build array of acceptable roles
    let validRoles = [];
    if (allowedRoles && Array.isArray(allowedRoles)) {
      validRoles = allowedRoles;
    } else if (allowedRole) {
      validRoles = [allowedRole];
    }

    if (validRoles.length > 0) {
      const isAllowed = validRoles.some((role) => {
        if (role === "Security Administrator" || role === "Admin" || role === "admin") {
          return isAdmin;
        }
        if (role === "Security Analyst" || role === "Analyst" || role === "analyst") {
          return !isAdmin;
        }
        return userRole === role;
      });

      if (!isAllowed) {
        return <Navigate to={isAdmin ? "/admin/dashboard" : "/analyst/dashboard"} replace />;
      }
    }

    return children;
  } catch (e) {
    localStorage.removeItem("netshield_user");
    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;
