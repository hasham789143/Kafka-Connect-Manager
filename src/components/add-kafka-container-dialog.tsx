"use client";

import * as React from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useToast } from "@/hooks/use-toast";
import { KafkaConnectConfig } from "@/lib/data";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL."),
  username: z.string().optional(),
  password: z.string().optional(),
});

type AddKafkaContainerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: KafkaConnectConfig) => void;
  currentConfig: KafkaConnectConfig | null;
};

export function AddKafkaContainerDialog({ open, onOpenChange, onSave, currentConfig }: AddKafkaContainerDialogProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "https://poc-kafka.vitonta.com/",
      username: "admin",
      password: "P@ssw0rd@kafka",
    },
  });

  React.useEffect(() => {
    if (open && currentConfig) {
      form.reset(currentConfig);
    } else if (open) {
      form.reset({
        url: "https://poc-kafka.vitonta.com/",
        username: "admin",
        password: "P@ssw0rd@kafka",
      });
    }
  }, [open, currentConfig, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave({
        url: values.url,
        username: values.username,
        password: values.password
    });
    toast({
      title: "Kafka Connection Saved",
      description: "Your Kafka connection details have been saved.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kafka Connection Details</DialogTitle>
          <DialogDescription>
            Enter the details for your Kafka Connect instance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kafka Connect URL</FormLabel>
                  <FormControl>
                    <Input placeholder="http://localhost:8083" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save & Connect</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
