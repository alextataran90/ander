import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import LoadingOverlay from "@/components/ui/loading-overlay";

export default function EmailConfirm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if there are auth tokens in the URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session using the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            toast({
              title: "Email confirmed!",
              description: "Your account has been verified successfully.",
            });
            setLocation("/");
          }
        } else {
          // No tokens found, redirect to login
          toast({
            title: "Invalid confirmation link",
            description: "Please try signing up again or contact support.",
            variant: "destructive",
          });
          setLocation("/login");
        }
      } catch (error: any) {
        console.error("Email confirmation error:", error);
        toast({
          title: "Confirmation failed",
          description: error.message || "Unable to confirm your email. Please try again.",
          variant: "destructive",
        });
        setLocation("/signup");
      } finally {
        setIsProcessing(false);
      }
    };

    handleEmailConfirmation();
  }, [setLocation, toast]);

  return (
    <LoadingOverlay 
      isVisible={isProcessing} 
      message="Confirming your email..." 
      subtitle="Please wait while we verify your account"
    />
  );
}