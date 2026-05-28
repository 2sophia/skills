import { Sidebar } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";

// Everything under (app) sits behind the auth gate (see proxy.ts) and shares
// this shell: sidebar + a header with the user menu.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-end border-b px-6">
          <UserMenu />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
