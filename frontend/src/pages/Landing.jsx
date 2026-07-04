import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "AI Waste Intelligence",
    body: "Upload a photo of any waste item and get an instant material read: plastic, paper, cardboard, glass, metal or organic, with a confidence score.",
  },
  {
    title: "Explainable Recycler Matching",
    body: "Every recommended recycler comes with a transparent score out of 100 - material fit, capacity, distance and reliability, laid out line by line.",
  },
  {
    title: "Material Passport",
    body: "Every batch carries a lifecycle timeline from collection to recycling, so nothing disappears once it leaves your hands.",
  },
  {
    title: "ESG Analytics",
    body: "Live diversion rate, material mix and lifecycle charts, generated from real batch data - not invented numbers.",
  },
];

const LOOP_STAGES = ["Scan", "Classify", "Batch", "Match", "Track", "Report"];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="badge bg-moss-100 text-moss-700 mb-5">Circular Waste Intelligence</span>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-ink">
            Waste isn't the problem.
            <br />
            <span className="text-moss-600">Disconnected recycling is.</span>
          </h1>
          <p className="mt-5 text-ink/70 text-lg max-w-md">
            ReLoop AI turns a photo of waste into a classified, matched and fully traceable
            recycling opportunity - end to end, on one platform.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/scan" className="btn-primary text-base px-6 py-3">Scan Waste</Link>
            <Link to="/dashboard" className="btn-secondary text-base px-6 py-3">View ESG Dashboard</Link>
          </div>
        </div>

        {/* Signature: a looping ring of the six pipeline stages, echoing "ReLoop" */}
        <div className="relative aspect-square max-w-sm mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-moss-200" />
          {LOOP_STAGES.map((stage, i) => {
            const angle = (i / LOOP_STAGES.length) * 2 * Math.PI - Math.PI / 2;
            const r = 44; // percent radius
            const x = 50 + r * Math.cos(angle);
            const y = 50 + r * Math.sin(angle);
            return (
              <div
                key={stage}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div className="h-14 w-14 rounded-full bg-white border border-moss-200 shadow-sm flex items-center justify-center text-moss-700 font-display font-semibold text-xs">
                  {stage}
                </div>
              </div>
            );
          })}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-full bg-moss-600 text-white flex items-center justify-center text-center text-xs font-display font-semibold p-2">
              ReLoop
              <br />
              Engine
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <h3 className="font-semibold text-lg mb-2 text-moss-800">{f.title}</h3>
              <p className="text-ink/65 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline strip */}
      <section className="bg-moss-900 text-white py-14">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xl font-semibold mb-8 text-center">The ReLoop pipeline</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["Waste Image", "AI Classification", "Waste Batch", "Recycler Matching", "Material Passport", "ESG Dashboard"].map(
              (step, i, arr) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="rounded-full border border-white/30 px-4 py-2 text-sm">{step}</span>
                  {i < arr.length - 1 && <span className="text-white/40">&rarr;</span>}
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
