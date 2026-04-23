"use client";

export default function LogoutButton() {
  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <button
      onClick={handleLogout}
      className="us-btn-secondary text-sm"
    >
      Log Out
    </button>
  );
}
