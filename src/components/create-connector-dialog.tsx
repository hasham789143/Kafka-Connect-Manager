"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "./ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useToast } from "@/hooks/use-toast";
import { createConnectorAction } from "@/app/actions";
import * as React from "react";
import { KafkaConnectConfig } from "@/lib/data";

const KAFKA_CONNECT_CONFIG_KEY = 'kafka-connect-config';

const formSchema = z.object({
  name: z.string().min(1, "Connector name is required."),
  config: z
    .string()
    .min(1, "Configuration is required.")
    .refine(
      (val) => {
        try {
          JSON.parse(val);
          return true;
        } catch (e) {
          return false;
        }
      },
      { message: "Configuration must be valid JSON." }
    ),
});

type CreateConnectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function CreateConnectorDialog({ open, onOpenChange, onSuccess }: CreateConnectorDialogProps) {
    const { toast } = useToast();
    const [config, setConfig] = React.useState<KafkaConnectConfig | null>(null);

    React.useEffect(() => {
        try {
            const storedConfig = localStorage.getItem(KAFKA_CONNECT_CONFIG_KEY);
            if (storedConfig) {
                setConfig(JSON.parse(storedConfig));
            }
        } catch (e) {
            console.error("Could not parse kafka config from local storage", e);
        }
    }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      config: JSON.stringify({
        "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
        "tasks.max": "1",
        "connection.url": "jdbc:postgresql://localhost:5432/testdb",
        "topic.prefix": "my-topic-"
      }, null, 2),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!config) {
        toast({
            variant: "destructive",
            title: "Connection details are missing",
            description: "Could not find Kafka Connect configuration.",
        });
        return;
    }
    const result = await createConnectorAction(config, values.name, JSON.parse(values.config));

    if (result.success) {
      toast({
        title: "Connector created successfully",
        description: `Connector '${values.name}' has been created.`,
      });
      onSuccess();
      onOpenChange(false);
      form.reset();
    } else {
        toast({
            variant: "destructive",
            title: "Failed to create connector",
            description: result.error,
        });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Connector</DialogTitle>
          <DialogDescription>
            Enter the details for your new Kafka Connect connector.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connector Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., my-jdbc-source-connector" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter connector configuration in JSON format"
                      className="min-h-[250px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide the full connector configuration as a JSON object.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Connector
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
