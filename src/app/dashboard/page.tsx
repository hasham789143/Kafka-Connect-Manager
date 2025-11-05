import { getConnectors } from '@/lib/data';
import { ConnectorDashboard } from '@/components/connector-dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default async function DashboardPage() {
  const { connectors, error } = await getConnectors();

  if (error) {
    return (
      <div className="flex w-full flex-col">
         <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Connectors</h1>
            <p className="text-muted-foreground">
              Manage your Kafka Connect connectors.
            </p>
          </div>
        </header>
        <Alert variant="destructive" className="mt-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Failed to load connectors</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <ConnectorDashboard connectors={connectors || []} />;
}
