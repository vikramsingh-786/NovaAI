import LoadingSpinner from "../components/ui/LoadingSpinner"; 

export default function DashboardLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--background-primary)]">
      <LoadingSpinner />
      <p className="ml-4 text-[var(--accent-purple)]">Loading your NovaAI dashboard...</p>
    </div>
  );
}