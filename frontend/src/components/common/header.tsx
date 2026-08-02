import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              SalesAI
            </span>
          </Link>
          <Badge variant="outline" className="text-xs">
            Enterprise Architecture v0.1
          </Badge>
        </div>

        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
            Architecture
          </Link>
          <Link href="/settings/projects" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Projects
          </Link>
          <Link href="/settings/api-keys" className="transition-colors hover:text-foreground/80 text-foreground/60">
            API Keys
          </Link>
          <Link href="/api-docs" className="transition-colors hover:text-foreground/80 text-foreground/60">
            API Docs
          </Link>
          <Link href="http://localhost:8000/api/v1/docs" target="_blank" className="transition-colors hover:text-foreground/80 text-foreground/60">
            FastAPI OpenAPI
          </Link>
        </nav>
      </div>
    </header>
  );
}

