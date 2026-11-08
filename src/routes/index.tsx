import { createFileRoute } from "@tanstack/react-router";
import { Library } from "@/components/library";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Library />;
}
