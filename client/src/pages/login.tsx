import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { supabase } from "@/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { useHaptic } from "@/hooks/use-haptic";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import LoadingOverlay from "@/components/ui/loading-overlay";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { triggerHaptic } = useHaptic();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setLocation("/");
          return;
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [setLocation]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      return authData;
    },
    onSuccess: () => {
      triggerHaptic("heavy");
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      triggerHaptic("medium");
      let errorMessage = "Please check your credentials and try again.";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Please check your email and confirm your account first.";
      }

      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    triggerHaptic("medium");
    loginMutation.mutate(data);
  };

  if (isCheckingAuth) {
    return <LoadingOverlay isVisible={true} message="Checking authentication..." subtitle="Please wait" />;
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-4 safe-area-top safe-area-bottom">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="glass rounded-2xl p-6 mb-6">
              <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-login-title">
                Welcome Back
              </h1>
              <p className="text-white/70">Sign in to your Ander account</p>
            </div>
          </div>

          {/* Login Form */}
          <div className="glass-strong rounded-3xl p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-white/80 text-sm font-medium">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <input
                          type="email"
                          className="ios-input w-full"
                          placeholder="your@email.com"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      {fieldState.error && (
                        <p className="text-ios-red text-sm mt-1">{fieldState.error.message}</p>
                      )}
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-white/80 text-sm font-medium">
                        Password
                      </FormLabel>
                      <FormControl>
                        <input
                          type="password"
                          className="ios-input w-full"
                          placeholder="Enter your password"
                          {...field}
                          data-testid="input-password"
                        />
                      </FormControl>
                      {fieldState.error && (
                        <p className="text-ios-red text-sm mt-1">{fieldState.error.message}</p>
                      )}
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="ios-button w-full bg-ios-blue text-white rounded-2xl py-4 font-semibold text-lg disabled:opacity-50"
                  data-testid="button-login"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </Form>

            {/* Forgot Password Link */}
            <div className="text-center mt-4">
              <button 
                className="text-white/70 text-sm hover:text-white/90 transition-colors"
                data-testid="link-forgot-password"
              >
                Forgot your password?
              </button>
            </div>

            {/* Signup Link */}
            <div className="text-center mt-6">
              <p className="text-white/70 text-sm">
                Don't have an account?{" "}
                <Link href="/signup">
                  <button className="text-ios-blue font-medium hover:text-ios-blue/80 transition-colors" data-testid="link-signup">
                    Create Account
                  </button>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <LoadingOverlay 
        isVisible={loginMutation.isPending} 
        message="Signing you in..." 
        subtitle="Please wait"
      />
    </>
  );
}