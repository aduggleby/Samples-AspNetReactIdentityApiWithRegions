import { useState, useEffect } from "react";
import ApiService from "../services/ApiService";
import "./Weather.css";

interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string;
}

const Weather = () => {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await ApiService.getWeatherForecast();
        setForecasts(data);
        setError(null);
      } catch (err) {
        setError("Failed to load weather forecast");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) return <div>Loading weather forecast...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="weather-container">
      <h2>Weather Forecast</h2>
      <table className="weather-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Temp. (C)</th>
            <th>Temp. (F)</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {forecasts.map((forecast, index) => (
            <tr key={index}>
              <td>{new Date(forecast.date).toLocaleDateString()}</td>
              <td>{forecast.temperatureC}°C</td>
              <td>{forecast.temperatureF}°F</td>
              <td>{forecast.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Weather;
