"use client";

import * as React from "react";
import { Connector } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRightLeft,
  PlusCircle,
  Search,
} from "lucide-react";
import { ConnectorTable } from "./connector-table";
import { CreateConnectorDialog } from "./create-connector-dialog";
import { ImportExportDialog } from "./import-export-dialog";
import { ErrorAnalysisDialog } from "./error-analysis-dialog";

type ConnectorDashboardProps = {
  connectors: Connector[];
};

export function ConnectorDashboard({ connectors: initialConnectors }: ConnectorDashboardProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [importExportOpen, setImportExportOpen] = React.useState(false);
  const [analysisConnector, setAnalysisConnector] = React.useState<Connector | null>(null);

  const filteredConnectors = React.useMemo(() => {
    if (!searchTerm) return initialConnectors;
    return initialConnectors.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, initialConnectors]);
  
  const handleAnalyzeError = (connector: Connector) => {
    setAnalysisConnector(connector);
  };

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
            <Button className="flex-1" onClick={() => setCreateOpen(true)}>
              <PlusCircle />
              Create Connector
            </Button>
          </div>
        </div>
      </header>

      <div className="mt-6">
        <ConnectorTable connectors={filteredConnectors} onAnalyzeError={handleAnalyzeError} />
      </div>

      <CreateConnectorDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ImportExportDialog open={importExportOpen} onOpenChange={setImportExportOpen} />
      <ErrorAnalysisDialog 
        connector={analysisConnector} 
        open={!!analysisConnector} 
        onOpenChange={(open) => !open && setAnalysisConnector(null)} 
      />
    </div>
  );
}
