
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

const KAFKA_CONNECT_CONFIG_KEY = 'kafka-connect-config';

export default function AuthPage() {
    const router = useRouter();
    const [url, setUrl] = React.useState("https://poc-kafka.vitonta.com/");
    const [username, setUsername] = React.useState("admin");
    const [password, setPassword] = React.useState("P@ssw0rd@kafka");

    React.useEffect(() => {
        try {
            const storedConfig = localStorage.getItem(KAFKA_CONNECT_CONFIG_KEY);
            if (storedConfig) {
                const { url, username, password } = JSON.parse(storedConfig);
                setUrl(url || "https://poc-kafka.vitonta.com/");
                setUsername(username || "admin");
                setPassword(password || "P@ssw0rd@kafka");
            }
        } catch (e) {
            console.error("Could not parse kafka config from local storage", e);
        }
    }, []);

    const handleSignIn = () => {
        try {
            const config = { url, username, password };
            localStorage.setItem(KAFKA_CONNECT_CONFIG_KEY, JSON.stringify(config));
            router.push('/dashboard');
        } catch (e) {
            console.error("Could not save kafka config to local storage", e);
        }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Please sign in</CardTitle>
          <CardDescription>
            Enter your Kafka Connect credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Kafka Connect URL</Label>
            <Input id="url" placeholder="https://kafka-connect:8083" required value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Email</Label>
            <Input id="username" placeholder="admin" required value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSignIn}>Sign in</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
