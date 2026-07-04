import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";

const CONDITIONS = ["clean", "mixed", "contaminated", "wet"];

export default function CreateBatch() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState("");
  const [sourceLocation, setSourceLocation] = useState("");
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!state?.material_type) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">No classification found</h1>
        <p className="text-ink/60 mb-6">Start by scanning a waste image so we know what material this batch is.</p>
        <Link to="/scan" className="btn-primary">Go to Scanner</Link>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    if (!quantity || !sourceLocation) {
      setError("Please fill in quantity and source location.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const batch = await api.createBatch({
        material_type: state.material_type,
        quantity: parseFloat(quantity),
        source_location: sourceLocation,
        condition,
        image_url: state.image_url || null,
        confidence: state.confidence,
      });
      navigate(`/matching?batch=${batch.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <span className="badge bg-moss-100 text-moss-700 mb-3">Step 2 of 6</span>
      <h1 className="text-3xl font-semibold mb-2">Create Material Batch</h1>
      <p className="text-ink/65 mb-8">Confirm the details collected during scanning to register this batch.</p>

      <div className="card p-6 mb-6 flex items-center gap-5">
        {state.image_url && (
          <img src={state.image_url} alt="waste" className="h-20 w-20 rounded-xl object-cover" />
        )}
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/50 mb-1">Classified material</p>
          <p className="font-display font-semibold text-xl capitalize mb-1">{state.material_type}</p>
          <div className="flex items-center gap-2">
            <StatusBadge value={state.recyclability} />
            <span className="text-xs text-ink/50">{Math.round(state.confidence * 100)}% confidence</span>
            {state.was_corrected && <span className="text-xs text-clay-500">manually corrected</span>}
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-5">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Quantity (KG)</label>
          <input
            className="input"
            type="number"
            min="0.1"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 52"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Source location</label>
          <input
            className="input"
            value={sourceLocation}
            onChange={(e) => setSourceLocation(e.target.value)}
            placeholder="e.g. Canteen Block A"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Condition</label>
            <select className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
              {CONDITIONS.map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Collection date</label>
            <input
              className="input"
              type="date"
              value={collectionDate}
              onChange={(e) => setCollectionDate(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating batch..." : "Create Batch & Find Recyclers"}
        </button>
      </form>
    </div>
  );
}
