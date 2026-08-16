import { requireSessionUserId } from "@/lib/session";
import { getUserSettings } from "@/lib/settings";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { BottomNav } from "@/components/nav/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireSessionUserId();
  const settings = await getUserSettings(userId);

  return (
    <ThemeProvider initialScheme={settings.colorScheme}>
      <ToastProvider>
        <main className="mx-auto min-h-full w-full max-w-lg pb-28">{children}</main>
        <BottomNav />
      </ToastProvider>
    </ThemeProvider>
  );
}
