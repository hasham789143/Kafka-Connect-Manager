import { getConnectors } from '@/lib/data';
import { ConnectorDashboard } from '@/components/connector-dashboard';

export default async function DashboardPage() {
  const connectors = await getConnectors();
  return <ConnectorDashboard connectors={connectors} />;
}
