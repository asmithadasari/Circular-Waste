import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import ScoreBar from "../components/ScoreBar.jsx";

export default function Matching() {
  const [params] = useSearchParams();
  const batchId = params.get("batch") || sessionStorage.getItem("activeBatchId");
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!batchId) {
      setLoading(false);
      return;
    }
    sessionStorage.setItem("activeBatchId", batchId);
    Promise.all([api.getBatch(batchId), api.getMatches(batchId)])
      .then(([b, m]) => {
        setBatch(b);
        setMatches(m);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [batchId]);

  async function select(matchId) {
    setSelecting(matchId);
    try {
      await api.selectMatch(matchId);
      navigate(`/passport?batch=${batchId}`);
    } catch (e) {
      setError(e.message);
      setSelecting(null);
    }
  }

  if (!batchId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">No batch selected</h1>
        <p className="text-ink/60 mb-6">Create a waste batch first to see ranked recycler matches.</p>
        <Link to="/scan" className="btn-primary">Scan Waste</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-14">
      <span className="badge bg-moss-100 text-moss-700 mb-3">Step 3 of 6</span>
      <h1 className="text-3xl font-semibold mb-2">Explainable Recycler Matching</h1>
      <p className="text-ink/65 mb-8">
        Recyclers are ranked with a deterministic, auditable score out of 100 - no black-box AI decides who gets your waste.
      </p>

      {batch && (
        <div className="card p-5 mb-8 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <p><span className="text-ink/50">Batch</span> <span className="font-semibold">{batch.batch_code}</span></p>
          <p><span className="text-ink/50">Material</span> <span className="font-semibold capitalize">{batch.material_type}</span></p>
          <p><span className="text-ink/50">Quantity</span> <span className="font-semibold">{batch.quantity} kg</span></p>
          <p><span className="text-ink/50">Source</span> <span className="font-semibold">{batch.source_location}</span></p>
        </div>
      )}

      {loading && <p className="text-ink/50">Finding suitable recyclers...</p>}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {!loading && matches.length === 0 && (
        <div className="card p-8 text-center text-ink/60">
          No simulated recyclers currently accept this material type. Try seeding recyclers via <code>python -m app.seed</code>.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {matches.map((m, idx) => (
          <div key={m.match_id} className="card p-6 relative">
            {idx === 0 && (
              <span className="absolute -top-3 left-6 badge bg-clay-500 text-white">Top match</span>
            )}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-lg">{m.recycler_name}</h3>
                <p className="text-xs text-ink/50 mt-1">
                  {m.distance_km} km away &middot; {m.capacity} kg capacity &middot; {m.rating}&#9733; rating
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-2xl text-moss-700">{m.score_breakdown.total}</p>
                <p className="text-xs text-ink/40">/ 100</p>
              </div>
            </div>

            <div className="space-y-2.5 mb-5">
              <ScoreBar label="Material Match" score={m.score_breakdown.material_match} max={40} />
              <ScoreBar label="Capacity Fit" score={m.score_breakdown.capacity_fit} max={25} />
              <ScoreBar label="Distance" score={m.score_breakdown.distance} max={20} />
              <ScoreBar label="Reliability" score={m.score_breakdown.reliability} max={15} />
            </div>

            <button
              className="btn-primary w-full"
              disabled={m.status === "SELECTED" || selecting !== null}
              onClick={() => select(m.match_id)}
            >
              {m.status === "SELECTED" ? "Selected" : selecting === m.match_id ? "Selecting..." : "Select this recycler"}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-ink/40 mt-6">
        Recycler records are clearly simulated for this demo and do not represent real facilities.
      </p>
    </div>
  );
}
