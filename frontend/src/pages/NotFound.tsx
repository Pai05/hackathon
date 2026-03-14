import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { CosmicBackdrop } from "@/components/CosmicBackdrop";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center app-shell px-6 relative overflow-hidden">
      <CosmicBackdrop />
      <div className="glass-panel neon-border rounded-2xl p-8 text-center max-w-xl w-full">
        <h1 className="mb-2 text-6xl font-heading font-extrabold text-foreground">404</h1>
        <p className="mb-5 text-xl text-muted-foreground">This page drifted out of orbit.</p>
        <a href="/" className="inline-flex items-center justify-center h-11 px-6 rounded-md gradient-primary text-primary-foreground font-semibold hover:opacity-95 transition-opacity">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
