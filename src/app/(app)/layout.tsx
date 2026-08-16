import { requireSessionUserId } from "@/lib/session";
import { getUserSettings } from "@/lib/settings";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { BottomNav } from "@/components/nav/BottomNav";
import { SwipeNavigation } from "@/components/nav/SwipeNavigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireSessionUserId();
  const settings = await getUserSettings(userId);

  return (
    <ThemeProvider initialScheme={settings.colorScheme}>
      <ToastProvider>
        <SwipeNavigation>{children}</SwipeNavigation>
        <BottomNav />
      </ToastProvider>
    </ThemeProvider>
  );
}
