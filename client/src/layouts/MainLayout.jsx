import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

/*
|--------------------------------------------------------------------------
| Main layout
|--------------------------------------------------------------------------
|
| The sidebar was `hidden md:flex`, which left phones and small tablets with
| no way to reach conversations or start a new chat at all. Below the md
| breakpoint it is now an overlay drawer opened from the navbar; from md up
| it stays a permanent column and the drawer state is irrelevant.
|
| min-h-0 on the flex children is what lets the transcript scroll instead of
| pushing the composer off screen.
*/

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Escape closes the drawer, matching what a modal overlay implies.
  useEffect(() => {
    if (!sidebarOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") setSidebarOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen((open) => !open)} />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-h-0 min-w-0 flex-1 bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
