import React from "react";

export const USFlagSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 7410 3900"
    style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
  >
    <rect width="7410" height="3900" fill="#fff" />
    <path fill="#b22234" d="M0 0h7410v300H0zM0 600h7410v300H0zM0 1200h7410v300H0zM0 1800h7410v300H0zM0 2400h7410v300H0zM0 3000h7410v300H0z" />
    <rect width="2964" height="2100" fill="#3c3b6e" />
    {/* For brevity, stars are omitted */}
  </svg>
);

export const EUFlagSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 900 600"
    style={{ marginRight: "0.5rem", verticalAlign: "middle" }}
  >
    <rect width="900" height="600" fill="#003399" />
    {/* Simplified EU flag: a circle representing the layout of stars */}
    <circle cx="450" cy="300" r="200" fill="none" stroke="#FFCC00" strokeWidth="40" />
  </svg>
);

export const FlagIcon = ({ region }: { region: string }) => {
  if (region.toUpperCase() === "US") {
    return <USFlagSVG />;
  } else if (region.toUpperCase() === "EU") {
    return <EUFlagSVG />;
  }
  return null;
};
