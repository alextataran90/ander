import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import LoadingOverlay from "@/components/ui/loading-overlay";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return <LoadingOverlay isVisible={true} message="Loading..." subtitle="Please wait" />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}