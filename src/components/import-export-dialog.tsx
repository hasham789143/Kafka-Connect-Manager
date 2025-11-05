"use client";

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

type ImportExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import / Export Connectors</DialogTitle>
          <DialogDescription>
            Import from or export connectors to a file.
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
                <Label htmlFor="kafka-url">Kafka Connect URL</Label>
                <Input id="kafka-url" placeholder="http://localhost:8083" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username (Optional)</Label>
                  <Input id="username" placeholder="user" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password (Optional)</Label>
                  <Input id="password" type="password" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="config-file">Configuration File</Label>
                <Input id="config-file" type="file" />
              </div>
              <Button className="w-full">Import Connectors</Button>
            </div>
          </TabsContent>
          <TabsContent value="export">
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Export all current connector configurations to a JSON file.
              </p>
              <Button className="w-full">Export All Connectors</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
