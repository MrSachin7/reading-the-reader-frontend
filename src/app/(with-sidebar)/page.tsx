import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Theme System</CardTitle>
        <CardDescription>
          This page uses the shared sidebar + navbar layout route group.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <p className="max-w-2xl text-muted-foreground">
          Switch mode and palette from the navbar to validate your global tokens.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <a
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Deploy
            </a>
          </Button>
          <Button asChild variant="outline">
            <a
              href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

