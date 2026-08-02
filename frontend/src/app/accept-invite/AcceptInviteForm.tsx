"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { organizationService } from "@/services/organization";

export default function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Missing invitation token.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await organizationService.acceptInvitation({
        token,
        first_name: firstName,
        last_name: lastName,
        password,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full border-border/60 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-extrabold">Join Organization Workspace</CardTitle>
          <CardDescription>
            You have been invited to collaborate on SalesAI SaaS workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="text-emerald-400 font-semibold text-lg">Invitation Accepted! 🎉</div>
              <p className="text-xs text-muted-foreground">
                Your account has been added to the organization workspace.
              </p>
              <Button asChild className="w-full">
                <a href="/settings/organization">Go to Workspace</a>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded bg-destructive/15 border border-destructive/30 text-xs text-destructive">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Jane"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Set Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !token}>
                {loading ? "Joining..." : "Accept Invitation & Join"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
