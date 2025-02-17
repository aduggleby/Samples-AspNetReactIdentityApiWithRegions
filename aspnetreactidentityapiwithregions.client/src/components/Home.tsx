import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import Authenticated from "./Authenticated";
import Unauthenticated from "./Unauthenticated";
import Weather from "./Weather";

const Home = () => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <main>
      <h1>Welcome to the Application</h1>
      <Authenticated>
        <p>You are logged in as {user?.email}</p>
        <Weather />
        <button onClick={handleLogout}>Logout</button>
      </Authenticated>
      <Unauthenticated>
        <p>Please log in to access more features.</p>
        <p>
          <Link to="/login">Login</Link> or <Link to="/register">Register</Link>
        </p>
      </Unauthenticated>
    </main>
  );
};

export default Home;
