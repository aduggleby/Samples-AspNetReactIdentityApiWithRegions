import { useAuth } from "../contexts/AuthContext";

interface AuthenticatedProps {
  children: React.ReactNode;
}

const Authenticated: React.FC<AuthenticatedProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === null) {
    return null;
  }

  return isAuthenticated ? <>{children}</> : null;
};

export default Authenticated;
