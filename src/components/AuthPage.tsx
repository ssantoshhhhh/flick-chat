import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MessageCircle, Mail, User, Eye, EyeOff } from "lucide-react";

type AuthMode = "login" | "signup" | "otp";

const AuthPage = () => {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    displayName: "",
    loginIdentifier: "",
    otp: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "signup") {
      // In real app: send signup request and switch to OTP
      setAuthMode("otp");
    } else if (authMode === "login") {
      // In real app: send login request and switch to OTP
      setAuthMode("otp");
    } else {
      // In real app: verify OTP and login
      console.log("OTP verification");
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
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:bg-gradient-hover transition-all duration-300"
              >
                {authMode === "login" && "Send Login Code"}
                {authMode === "signup" && "Create Account"}
                {authMode === "otp" && "Verify & Continue"}
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
                    onClick={() => setAuthMode("login")}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    ← Back to login
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