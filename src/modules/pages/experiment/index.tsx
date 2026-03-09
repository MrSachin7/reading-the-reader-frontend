import { ExperimentStepper } from "./components/experiment-stepper";

export default function ExperimentPage() {
  return (
    <main className="w-full px-4 py-6 sm:px-6 sm:py-8">
      <section className="mb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Experiment setup</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Prepare the session from one workspace.</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
          Each step stays focused on one job. The calibration step opens its own full-screen flow so
          the participant uses the entire display.
        </p>
      </section>
      <section className="w-full">
        <ExperimentStepper />
      </section>
    </main>
  );
}
