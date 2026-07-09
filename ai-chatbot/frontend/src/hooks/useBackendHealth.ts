import { useEffect, useState } from "react";
import { getBackendApiUrl } from "@/lib/backend";

interface BackendHealth {
  status: string;
  provider: string;
  api_connected: boolean;
  mongodb_connected: boolean;
}

interface BackendCapabilities {
  has_upload: boolean;
  has_chat: boolean;
  health: BackendHealth | null;
}

export function useBackendHealth() {
  const [capabilities, setCapabilities] = useState<BackendCapabilities>({
    has_upload: false,
    has_chat: false,
    health: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch OpenAPI spec to check available endpoints
        const spec = await fetch(getBackendApiUrl("/openapi.json"));
        const specData = await spec.json();
        const paths = Object.keys(specData.paths || {});

        const has_upload = paths.some((p) => p.includes("upload"));
        const has_chat = paths.some((p) => p.includes("chat"));

        // Fetch health check
        const healthRes = await fetch(getBackendApiUrl("/api/health"));
        const health = healthRes.ok ? await healthRes.json() : null;

        setCapabilities({
          has_upload,
          has_chat,
          health,
        });

        if (!has_upload) {
          setError(
            "Backend upload feature unavailable. File uploads will not work."
          );
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to check backend";
        setError(`Backend health check failed: ${message}`);
        setCapabilities({
          has_upload: false,
          has_chat: false,
          health: null,
        });
      } finally {
        setLoading(false);
      }
    };

    checkBackend();
    // Recheck periodically (every 5 minutes)
    const interval = setInterval(checkBackend, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { capabilities, loading, error };
}
