"use client";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="us-btn-secondary min-w-36 text-sm"
    >
      Log Out
    </button>
  );
}
