import { ToastProvider } from "@/components/ui/Toast";
import { BottomNav } from "@/components/nav/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <main className="mx-auto min-h-full w-full max-w-lg pb-28">{children}</main>
      <BottomNav />
    </ToastProvider>
  );
}
