import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';

export default function AuthPage() {
  const { user, register, verifyRegister, login, verifyLogin, loading, error } = useAuth();
  // Add state for form fields, OTP, 2FA, etc.
  // Render login/signup forms, handle all flows using the hook
  return (
    <div>
      <h1>Flick Auth</h1>
      {/* Render forms and handle all flows */}
      {error && <div>{error}</div>}
    </div>
  );
} 