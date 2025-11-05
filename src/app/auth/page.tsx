
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

    const handleSignIn = () => {
        try {
            const config = { url, username, password };
            localStorage.setItem(KAFKA_CONNECT_CONFIG_KEY, JSON.stringify(config));
            router.push('/dashboard');
        } catch (e) {
            console.error("Could not save kafka config to local storage", e);
            // Optionally, show an error to the user
        }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Please sign in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="Username" required value={username} onChange={e => setUsername(e.target.value)} />
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
