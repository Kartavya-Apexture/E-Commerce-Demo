import path from "node:path";
import { tmpdir } from "node:os";

type DatabaseEnvironment = {
  VERCEL?: string;
  VERCEL_DEPLOYMENT_ID?: string;
  DEMO_DB_PATH?: string;
};

export function databasePath(
  environment: DatabaseEnvironment,
  temporaryDirectory = tmpdir(),
) {
  if (environment.VERCEL === "1") {
    // Vercel's application directory is read-only. Each instance gets a
    // disposable demo database; this deliberately provides no shared storage.
    const deployment = (environment.VERCEL_DEPLOYMENT_ID || "preview")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 100);
    return path.join(
      temporaryDirectory,
      "kg-store-demo",
      deployment,
      "demo.sqlite",
    );
  }
  return path.resolve(
    /* turbopackIgnore: true */ environment.DEMO_DB_PATH || "data/aurelle.sqlite",
  );
}
