import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import Authenticated from "./Authenticated";
import Unauthenticated from "./Unauthenticated";
import Weather from "./Weather";
import ApiService, { AppSettings } from "../services/ApiService";
import { FlagIcon } from "./FlagIcons";

const Home = () => {
	const { logout, user } = useAuth();
	const [settings, setSettings] = useState<AppSettings>({ region: "", regions: {} });

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const data = await ApiService.getAppSettings();
				setSettings(data);
			} catch (error) {
				console.error("Error fetching app settings", error);
			}
		};
		fetchSettings();
	}, []);

	const handleLogout = async () => {
		await logout();
	};

	return (
		<main>
			<h1>Welcome to the {settings.region && <FlagIcon region={settings.region} />} application</h1>
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
				{settings.regions && Object.keys(settings.regions).length > 0 && (
					<div>
						<h2>Or switch to another region</h2>
						{Object.entries(settings.regions)
							.filter(([key]) => key !== settings.region)
							.map(([key, url]) => (
								<p key={key}>
									<FlagIcon region={key} />
									<a href={"https://" + url}>{url}</a>
								</p>
							))}
					</div>
				)}
			</Unauthenticated>
		</main>
	);
};

export default Home;
