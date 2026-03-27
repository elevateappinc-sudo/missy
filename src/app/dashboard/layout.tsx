import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-warm">
      <Sidebar />
      <main className="ml-[240px] p-8">{children}</main>
    </div>
  );
}
