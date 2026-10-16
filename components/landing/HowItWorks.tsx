const STEPS = [
  {
    number: '01',
    title: 'Connect',
    description:
      'Point Divya at your Postgres database through a secure, read-only connection. More data sources are on the roadmap.',
  },
  {
    number: '02',
    title: 'Model',
    description:
      'Define metrics and dimensions once in the semantic layer, so every dashboard — and eventually every API call — stays consistent.',
  },
  {
    number: '03',
    title: 'Build & share',
    description:
      'Design dashboards on a drag-and-drop canvas, then view and filter them. Embedding in your own product is next on the roadmap.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-border bg-surface border-t">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-text-primary text-3xl font-semibold tracking-tight sm:text-4xl">
            How it&apos;s meant to work
          </h2>
          <p className="text-text-secondary mt-4">
            The intended workflow, start to finish — some of this is live today, some of it is still
            being built.
          </p>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number}>
              <span className="text-primary text-sm font-semibold">{step.number}</span>
              <h3 className="text-text-primary mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-text-secondary mt-2 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
