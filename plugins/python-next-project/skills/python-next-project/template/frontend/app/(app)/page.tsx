"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [message, setMessage] = useState("…");

  useEffect(() => {
    api
      .get<{ message: string }>("/example")
      .then((r) => setMessage(r.message))
      .catch((e) => setMessage(String(e)));
  }, []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your authenticated app shell — replace this with real features.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Backend says</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-sm text-muted-foreground">{message}</code>
        </CardContent>
      </Card>
    </div>
  );
}
