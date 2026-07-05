import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";

const LIFECYCLE = ["COLLECTED", "CLASSIFIED", "BATCH_CREATED", "MATCHED", "PICKUP_SCHEDULED", "RECEIVED", "RECYCLED"];
const NEXT_STEP = {
  MATCHED: "PICKUP_SCHEDULED",
  PICKUP_SCHEDULED: "RECEIVED",
  RECEIVED: "RECYCLED",
};

export default function Passport() {
  const [params] = useSearchParams();
  const batchId = params.get("batch") || sessionStorage.getItem("activeBatchId");

  const [batch, setBatch] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [b, t] = await Promise.all([api.getBatch(batchId), api.getTimeline(batchId)]);
      setBatch(b);
      setTimeline(t);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (batchId) {
      sessionStorage.setItem("activeBatchId", batchId);
      load();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  async function advance() {
    const next = NEXT_STEP[batch.status];
    if (!next) return;
    setUpdating(true);
    setError(null);
    try {
      await api.updateStatus(batchId, next);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  }

  if (!batchId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">No batch selected</h1>
        <p className="text-ink/60 mb-6">Create and match a batch first to see its Material Passport.</p>
        <Link to="/scan" className="btn-primary">Scan Waste</Link>
      </div>
    );
  }

  const completedTypes = new Set(timeline.map((e) => e.event_type));

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <span className="badge bg-moss-100 text-moss-700 mb-3">Step 4 of 6</span>
      <h1 className="text-3xl font-semibold mb-2">Material Passport</h1>
      <p className="text-ink/65 mb-8">Every batch carries its own lifecycle record, from collection through to recycling.</p>

      {loading && <p className="text-ink/50">Loading passport...</p>}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {batch && (
        <>
          <div className="card p-5 mb-8 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
            <p><span className="text-ink/50">Batch</span> <span className="font-semibold">{batch.batch_code}</span></p>
            <p><span className="text-ink/50">Material</span> <span className="font-semibold capitalize">{batch.material_type}</span></p>
            <p><span className="text-ink/50">Quantity</span> <span className="font-semibold">{batch.quantity} kg</span></p>
            <StatusBadge value={batch.status} />
          </div>

          <div className="card p-6 mb-6">
            <ol className="relative border-l-2 border-moss-100 ml-3 space-y-8">
              {LIFECYCLE.map((stage) => {
                const done = completedTypes.has(stage);
                const event = timeline.find((e) => e.event_type === stage);
                return (
                  <li key={stage} className="ml-6">
                    <span
                      className={`absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 ${
                        done ? "bg-moss-600 border-moss-600" : "bg-white border-moss-200"
                      }`}
                    />
                    <p className={`font-medium ${done ? "text-ink" : "text-ink/35"}`}>{stage.replace(/_/g, " ")}</p>
                    {event && (
                      <p className="text-xs text-ink/45 mt-0.5">
                        {new Date(event.timestamp).toLocaleString()} &middot; by {event.actor}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {NEXT_STEP[batch.status] && (
            <button className="btn-primary" disabled={updating} onClick={advance}>
              {updating ? "Updating..." : `Mark as ${NEXT_STEP[batch.status].replace(/_/g, " ")}`}
            </button>
          )}
          {batch.status === "RECYCLED" && (
            <p className="text-moss-700 font-medium">This batch has completed its full recycling lifecycle. &#x1F331;</p>
          )}
          {batch.status === "BATCH_CREATED" && (
            <p className="text-ink/50 text-sm">Select a recycler on the Matching screen to continue this batch's journey.</p>
          )}
        </>
      )}
    </div>
  );
}
