
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import * as React from "react";
import { validateConnection } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Loader2 } from "lucide-react";

const KAFKA_CONNECT_CONFIG_KEY = 'kafka-connect-config';

export default function AuthPage() {
    const router = useRouter();
    const [url, setUrl] = React.useState("https://poc-kafka.vitonta.com/");
    const [username, setUsername] = React.useState("admin");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        try {
            const storedConfig = localStorage.getItem(KAFKA_CONNECT_CONFIG_KEY);
            if (storedConfig) {
                const { url, username } = JSON.parse(storedConfig);
                setUrl(url || "https://poc-kafka.vitonta.com/");
                setUsername(username || "admin");
            }
        } catch (e) {
            console.error("Could not parse kafka config from local storage", e);
        }
    }, []);

    const handleSignIn = async () => {
        setLoading(true);
        setError(null);
        const config = { url, username, password };
        const result = await validateConnection(config);

        if (result.success) {
            try {
                localStorage.setItem(KAFKA_CONNECT_CONFIG_KEY, JSON.stringify(config));
                router.push('/dashboard');
            } catch (e) {
                console.error("Could not save kafka config to local storage", e);
                setError("Failed to save connection details to your browser's local storage.");
                setLoading(false);
            }
        } else {
            setError(result.error || "An unknown error occurred during validation.");
            setLoading(false);
        }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Connect to Kafka</CardTitle>
          <CardDescription>
            Enter your Kafka Connect credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="url">Kafka Connect URL</Label>
            <Input id="url" placeholder="https://kafka-connect:8083" required value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="admin" required value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSignIn} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
