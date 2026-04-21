import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react";
import App from './App.tsx'
import './index.css'

Sentry.init({
  dsn: "https://c383e68a1049594f47f6812d9c38d79f@o4511255820042240.ingest.de.sentry.io/4511255853334608",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});
throw new Error("Sentry Test Error");
const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(<App />);
