"use client";

import { useState } from "react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async () => {
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        window.location.href = "/";
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        alert("Account created! You can now log in.");
        setIsLogin(true);
      }
    }
  };

  return (
    <main className="us-page flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[1.8rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)]">
        <p className="us-kicker text-center">Unified Steele</p>
        <h1 className="mb-6 mt-4 text-center text-3xl font-bold text-[var(--color-text)]">
          {isLogin ? "Login" : "Create Account"}
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            className="us-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="us-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {isLogin ? (
            <div className="text-right">
              <a
                href="/forgot-password"
                className="us-link text-sm"
              >
                Forgot Password?
              </a>
            </div>
          ) : null}

          <button
            onClick={handleAuth}
            className="us-btn-primary w-full"
          >
            {isLogin ? "Login" : "Create Account"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="us-link"
          >
            {isLogin ? "Create one" : "Login"}
          </button>
        </p>
      </div>
    </main>
  );
}
