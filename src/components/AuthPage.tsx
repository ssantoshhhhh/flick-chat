import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MessageCircle, Mail, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

type AuthMode = "login" | "signup" | "otp";

const AuthPage = () => {
  const { register, login, verifyRegister, verifyLogin, loading, error } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    displayName: "",
    loginIdentifier: "",
    otp: "",
    password: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (authMode === "signup") {
        // Step 1: Send registration request
        const result = await register(formData.email, formData.username, formData.displayName);
        setUserId(result.userId);
        
        // Show toast based on mailSent flag
        if (result.mailSent) {
          toast.success("OTP sent to your email! Check your inbox.");
        } else {
          toast.error("Failed to send OTP email. Please try again.");
        }
        
        setAuthMode("otp");
      } else if (authMode === "login") {
        // Step 1: Send login request
        const result = await login(formData.loginIdentifier);
        setUserId(result.userId);
        toast.success("OTP sent to your email! Check your inbox.");
        setAuthMode("otp");
      } else {
        // Step 2: Verify OTP
        if (userId) {
          if (authMode === "otp" && formData.password) {
            // Registration verification
            await verifyRegister(userId, formData.otp, formData.password);
            toast.success("Registration successful! Welcome to Flick!");
            // Force a small delay to ensure state is updated
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            // Login verification
            await verifyLogin(userId, formData.otp);
            toast.success("Login successful! Welcome back!");
            // Force a small delay to ensure state is updated
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }
      }
    } catch (err: any) {
      // Handle specific error cases
      if (err.response?.status === 404) {
        toast.error("Email not registered. Please sign up first.", {
          action: {
            label: "Sign Up",
            onClick: () => setAuthMode("signup")
          }
        });
      } else {
        toast.error(err.response?.data?.message || err.message || "An error occurred");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-primary animate-flick-glow">
              FLICK
            </h1>
          </div>
          <p className="text-muted-foreground">
            {authMode === "login" && "Welcome back to Flick"}
            {authMode === "signup" && "Join the Flick community"}
            {authMode === "otp" && "Enter verification code"}
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-card border-border shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-foreground">
              {authMode === "login" && "Sign In"}
              {authMode === "signup" && "Create Account"}
              {authMode === "otp" && "Verify Code"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-secondary-foreground">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="pl-10 bg-input border-border text-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-secondary-foreground">
                      Username (unique)
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Choose a unique username"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className="pl-10 bg-input border-border text-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-secondary-foreground">
                      Display Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Your display name"
                        value={formData.displayName}
                        onChange={(e) => handleInputChange("displayName", e.target.value)}
                        className="pl-10 bg-input border-border text-foreground"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {authMode === "login" && (
                <div className="space-y-2">
                  <Label htmlFor="loginIdentifier" className="text-secondary-foreground">
                    Username or Email
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="loginIdentifier"
                      type="text"
                      placeholder="Enter username or email"
                      value={formData.loginIdentifier}
                      onChange={(e) => handleInputChange("loginIdentifier", e.target.value)}
                      className="pl-10 bg-input border-border text-foreground"
                      required
                    />
                  </div>
                </div>
              )}

              {authMode === "otp" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-secondary-foreground">
                      Verification Code
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={formData.otp}
                      onChange={(e) => handleInputChange("otp", e.target.value)}
                      className="text-center text-lg tracking-widest bg-input border-border text-foreground"
                      maxLength={6}
                      required
                    />
                    <p className="text-sm text-muted-foreground text-center">
                      Code sent to {formData.email || formData.loginIdentifier}
                    </p>
                  </div>

                  {/* Password field for registration */}
                  {formData.email && (
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-secondary-foreground">
                        Create Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className="pr-10 bg-input border-border text-foreground"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-primary hover:bg-gradient-hover transition-all duration-300"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    {/* Lightning bolt SVG with spin animation */}
                    <svg className="animate-spin-slow h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  <>
                    {authMode === "login" && "Send Login Code"}
                    {authMode === "signup" && "Create Account"}
                    {authMode === "otp" && "Verify & Continue"}
                  </>
                )}
              </Button>
            </form>

            {/* Mode Switch */}
            <div className="mt-6 text-center space-y-2">
              {authMode === "login" && (
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setAuthMode("signup")}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              )}
              {authMode === "signup" && (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => setAuthMode("login")}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              )}
              {authMode === "otp" && (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Didn't receive the code?{" "}
                    <button className="text-primary hover:text-primary/80 transition-colors">
                      Resend
                    </button>
                  </p>
                  <button
                    onClick={() => setAuthMode(formData.email ? "signup" : "login")}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    ← Back to {formData.email ? "signup" : "login"}
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;