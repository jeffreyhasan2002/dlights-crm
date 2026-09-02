import { DlightsLoader } from "@/components/ui/dlights-loader";

export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center">
      <DlightsLoader
        label="Loading Workspace..."
        subtitle="Fetching live studio data"
        size="md"
      />
    </div>
  );
}
