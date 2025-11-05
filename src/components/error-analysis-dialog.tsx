"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Terminal } from "lucide-react";
import { getErrorAnalysis } from "@/app/actions";
import { Connector } from "@/lib/types";

type ErrorAnalysisDialogProps = {
  connector: Connector | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ErrorAnalysisDialog({ connector, open, onOpenChange }: ErrorAnalysisDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && connector?.errorMessage) {
      setLoading(true);
      setAnalysis(null);
      setError(null);

      const performAnalysis = async () => {
        const result = await getErrorAnalysis(connector.errorMessage!);
        if (result.data) {
          setAnalysis(result.data.solutions);
        } else {
          setError(result.error || "An unknown error occurred.");
        }
        setLoading(false);
      };

      performAnalysis();
    }
  }, [open, connector]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI-Powered Error Analysis</DialogTitle>
          <DialogDescription>
            Analyzing error for connector:{" "}
            <span className="font-semibold text-primary">{connector?.name}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-semibold mb-2">Original Error Message</h3>
            <pre className="text-xs p-4 rounded-md bg-muted text-muted-foreground whitespace-pre-wrap font-mono">
              {connector?.errorMessage || "No error message available."}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Analysis & Potential Solutions</h3>
            {loading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Analysis Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {analysis && (
              <div className="prose prose-sm max-w-none text-foreground">
                <p>{analysis}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
