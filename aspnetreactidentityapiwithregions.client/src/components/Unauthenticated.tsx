import { useAuth } from "../contexts/AuthContext";

interface UnauthenticatedProps {
  children: React.ReactNode;
}

const Unauthenticated: React.FC<UnauthenticatedProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return !isAuthenticated ? <>{children}</> : null;
};

export default Unauthenticated;
