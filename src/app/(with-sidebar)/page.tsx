import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <Button asChild>
      <Link href="/experiment">Start Experiment</Link>
    </Button>
  );
}

