import { ExperimentStepper } from "./components/experiment-stepper";

export default function ExperimentPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-start px-6 py-10">
      <section className="w-full rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="mb-6 text-xl font-semibold">New Experiment</h1>
        <ExperimentStepper />
      </section>
    </main>
  );
}
