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

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { triggerHaptic } = useHaptic();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
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

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpForm) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      return authData;
    },
    onSuccess: (data) => {
      triggerHaptic("heavy");
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Check your email!",
          description: "We've sent you a confirmation link to complete your signup.",
        });
      } else {
        toast({
          title: "Welcome!",
          description: "Your account has been created successfully.",
        });
        setLocation("/");
      }
    },
    onError: (error: any) => {
      triggerHaptic("medium");
      toast({
        title: "Sign up failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignUpForm) => {
    triggerHaptic("medium");
    signUpMutation.mutate(data);
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
              <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-signup-title">
                Create Account
              </h1>
              <p className="text-white/70">Join Ander to track your blood sugar</p>
            </div>
          </div>

          {/* Signup Form */}
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

                {/* Confirm Password Field */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-white/80 text-sm font-medium">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <input
                          type="password"
                          className="ios-input w-full"
                          placeholder="Confirm your password"
                          {...field}
                          data-testid="input-confirm-password"
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
                  disabled={signUpMutation.isPending}
                  className="ios-button w-full bg-ios-blue text-white rounded-2xl py-4 font-semibold text-lg disabled:opacity-50"
                  data-testid="button-signup"
                >
                  <i className="fas fa-user-plus mr-2"></i>
                  {signUpMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-white/70 text-sm">
                Already have an account?{" "}
                <Link href="/login">
                  <button className="text-ios-blue font-medium hover:text-ios-blue/80 transition-colors" data-testid="link-login">
                    Sign In
                  </button>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <LoadingOverlay 
        isVisible={signUpMutation.isPending} 
        message="Creating your account..." 
        subtitle="Setting up your profile"
      />
    </>
  );
}