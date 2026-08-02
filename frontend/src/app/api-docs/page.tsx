"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">API Documentation & Endpoints</h1>
        <p className="text-muted-foreground">
          Interactive OpenAPI & Swagger documentation hosted by the FastAPI backend service.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                GET
              </Badge>
              <CardTitle className="font-mono text-lg">/api/v1/health</CardTitle>
            </div>
            <Badge variant="outline">Health Check</Badge>
          </div>
          <CardDescription>
            Returns operational status of FastAPI backend, PostgreSQL database, and Redis cache.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-border/40 font-mono text-xs text-slate-300">
            <div className="text-slate-500">// Response 200 OK</div>
            <pre>{`{
  "success": true,
  "message": "SalesAI API health status retrieved successfully",
  "data": {
    "status": "healthy",
    "environment": "development",
    "version": "0.1.0",
    "timestamp": "2026-07-26T12:00:00.000Z",
    "database": "healthy",
    "redis": "healthy"
  }
}`}</pre>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Swagger UI & Interactive Docs</CardTitle>
          <CardDescription>
            Access auto-generated OpenAPI documentation to test backend endpoints interactively.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild variant="default">
            <a href="http://localhost:8000/api/v1/docs" target="_blank" rel="noopener noreferrer">
              Open FastAPI Swagger UI ↗
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="http://localhost:8000/api/v1/redoc" target="_blank" rel="noopener noreferrer">
              Open ReDoc ↗
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
