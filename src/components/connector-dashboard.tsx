
"use client";

import * as React from "react";
import { Connector } from "@/lib/types";
import { KafkaConnectConfig } from "@/lib/data";
import { getConnectorsAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRightLeft,
  PlusCircle,
  Search,
  Terminal,
  Loader2,
  Settings,
  FlaskConical,
} from "lucide-react";
import { ConnectorTable } from "./connector-table";
import { CreateConnectorDialog } from "./create-connector-dialog";
import { ImportExportDialog } from "./import-export-dialog";
import { ErrorAnalysisDialog } from "./error-analysis-dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from "next/navigation";

const KAFKA_CONNECT_CONFIG_KEY = 'kafka-connect-config';

export function ConnectorDashboard() {
  const router = useRouter();
  const [connectors, setConnectors] = React.useState<Connector[]>([]);
  const [config, setConfig] = React.useState<KafkaConnectConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [importExportOpen, setImportExportOpen] = React.useState(false);
  const [analysisConnector, setAnalysisConnector] = React.useState<Connector | null>(null);
  const [errorForAnalysis, setErrorForAnalysis] = React.useState<string | null>(null);


  React.useEffect(() => {
    try {
      const storedConfig = localStorage.getItem(KAFKA_CONNECT_CONFIG_KEY);
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        setConfig(parsedConfig);
      } else {
        router.push('/auth');
      }
    } catch (e) {
      console.error("Could not parse kafka config from local storage", e);
      router.push('/auth');
    }
  }, [router]);

  const fetchConnectors = React.useCallback(async (currentConfig: KafkaConnectConfig) => {
    setLoading(true);
    setError(null);
    const { connectors: fetchedConnectors, error: fetchError } = await getConnectorsAction(currentConfig);
    if (fetchError) {
      setError(fetchError);
    } else {
      setConnectors(fetchedConnectors || []);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (config) {
      fetchConnectors(config);
    }
  }, [config, fetchConnectors]);

  const filteredConnectors = React.useMemo(() => {
    if (!connectors) return [];
    if (!searchTerm) return connectors;
    return connectors.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, connectors]);
  
  const handleAnalyzeError = (connector: Connector) => {
    setAnalysisConnector(connector);
    setErrorForAnalysis(null);
  };
  
  const handleAnalyzeConnectionError = () => {
    setErrorForAnalysis(error);
    setAnalysisConnector(null);
  }

  return (
    <div className="flex w-full flex-col">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connectors</h1>
          <p className="text-muted-foreground">
            Manage your Kafka Connect connectors.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search connectors..."
              className="w-full pl-8 sm:w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setImportExportOpen(true)}>
              <ArrowRightLeft />
              Import / Export
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => router.push('/auth')}>
              <Settings />
              Connection
            </Button>
            <Button className="flex-1" onClick={() => setCreateOpen(true)}>
              <PlusCircle />
              Create Connector
            </Button>
          </div>
        </div>
      </header>
      
      <main className="mt-6">
        {loading && (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <span className="text-lg">Loading connectors...</span>
            </div>
        )}
        {error && !loading &&(
            <Alert variant="destructive" className="mt-6">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Failed to load connectors</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <div>
                    {error}
                    <Button variant="link" className="p-0 h-auto ml-2" onClick={() => router.push('/auth')}>
                        Update Connection Details
                    </Button>
                </div>
                <Button variant="destructive" size="sm" onClick={handleAnalyzeConnectionError}>
                  <FlaskConical className="mr-2" />
                  Analyze Error
                </Button>
              </AlertDescription>
            </Alert>
        )}
        {!loading && !error && (
            <ConnectorTable connectors={filteredConnectors} onAnalyzeError={handleAnalyzeError} />
        )}
      </main>

      <CreateConnectorDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ImportExportDialog open={importExportOpen} onOpenChange={setImportExportOpen} />
      <ErrorAnalysisDialog 
        connector={analysisConnector} 
        open={!!analysisConnector || !!errorForAnalysis} 
        onOpenChange={(open) => {
            if (!open) {
                setAnalysisConnector(null);
                setErrorForAnalysis(null);
            }
        }}
        errorMessage={errorForAnalysis}
      />
    </div>
  );
}
