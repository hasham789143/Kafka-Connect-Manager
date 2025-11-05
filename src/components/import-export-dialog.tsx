"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { exportConnectorsAction, importConnectorsAction } from "@/app/actions";
import { KafkaConnectConfig } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const KAFKA_CONNECT_CONFIG_KEY = 'kafka-connect-config';

type ImportExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function ImportExportDialog({ open, onOpenChange, onSuccess }: ImportExportDialogProps) {
  const { toast } = useToast();
  const [config, setConfig] = React.useState<KafkaConnectConfig | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importResults, setImportResults] = React.useState<{ name: string; success: boolean; error?: string }[] | null>(null);


  React.useEffect(() => {
    if (open) {
      setImportFile(null);
      setImportError(null);
      setImportResults(null);
    }
    try {
      const storedConfig = localStorage.getItem(KAFKA_CONNECT_CONFIG_KEY);
      if (storedConfig) {
        setConfig(JSON.parse(storedConfig));
      }
    } catch (e) {
      console.error("Could not parse kafka config from local storage", e);
    }
  }, [open]);

  const handleExport = async () => {
    if (!config) {
      toast({ variant: 'destructive', title: "Connection details are missing" });
      return;
    }
    setExporting(true);
    const { data, error } = await exportConnectorsAction(config);
    setExporting(false);

    if (error) {
      toast({ variant: 'destructive', title: "Export Failed", description: error });
    } else if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kafka-connectors.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export Successful", description: "Connector configurations have been downloaded." });
    }
  };

  const handleImport = async () => {
    if (!config) {
      toast({ variant: 'destructive', title: "Connection details are missing" });
      return;
    }
    if (!importFile) {
      setImportError("Please select a file to import.");
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const connectorsToImport = JSON.parse(content);
        const formattedConnectors = Object.entries(connectorsToImport).map(([name, config]) => ({ name, config }));
        const results = await importConnectorsAction(config, formattedConnectors);
        setImportResults(results);

        const successfulImports = results.filter(r => r.success).length;
        if (successfulImports > 0) {
          toast({ title: "Import Complete", description: `${successfulImports} of ${results.length} connectors imported successfully.` });
          onSuccess();
        } else {
            toast({ variant: 'destructive', title: "Import Failed", description: "No connectors were imported."});
        }
      } catch (e: any) {
        setImportError(`Failed to parse or process the file: ${e.message}`);
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setImportError("Failed to read the selected file.");
      setImporting(false);
    };
    reader.readAsText(importFile);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import / Export Connectors</DialogTitle>
          <DialogDescription>
            Import from or export connectors to a JSON file.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="import">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          <TabsContent value="import">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="config-file">Configuration File</Label>
                <Input id="config-file" type="file" accept=".json" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
              </div>
              {importError && <Alert variant="destructive"><AlertDescription>{importError}</AlertDescription></Alert>}
              {importResults && (
                <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                  <h4 className="font-semibold mb-2 text-sm">Import Results:</h4>
                  <ul className="text-xs space-y-1">
                    {importResults.map(res => (
                       <li key={res.name} className={`flex justify-between items-center p-1 rounded-sm ${res.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                           <span>{res.name}</span>
                           <span className={res.success ? 'text-green-600' : 'text-red-600'}>{res.success ? 'Success' : 'Failed'}</span>
                       </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button className="w-full" onClick={handleImport} disabled={importing || !importFile}>
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import Connectors
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="export">
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Export all current connector configurations to a single JSON file.
              </p>
              <Button className="w-full" onClick={handleExport} disabled={exporting}>
                {exporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Export All Connectors
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
