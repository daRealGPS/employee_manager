export const demoConfig = {
  enabled: import.meta.env.VITE_DEMO_MODE === "true",
  username: import.meta.env.VITE_DEMO_USERNAME || "demo",
  password: import.meta.env.VITE_DEMO_PASSWORD || "demo123",
};