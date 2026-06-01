import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "家族カレンダー",
  description: "家族のスケジュールを共有・管理するカレンダー",
};

// TODO: もし family-calendar の layout.tsx にフォントや Provider がある場合、
// ここに移植してください
export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
