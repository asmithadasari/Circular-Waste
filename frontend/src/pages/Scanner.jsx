import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import StatusBadge from "../components/StatusBadge.jsx";

const MATERIALS = ["plastic", "paper", "cardboard", "glass", "metal", "organic"];

export default function Scanner() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [correctedMaterial, setCorrectedMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  function onFile(f) {
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setCorrectedMaterial(null);
    setError(null);
  }

  function onDrop(e) {
    e.preventDefault();
    onFile(e.dataTransfer.files?.[0]);
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.classify(file);
      setResult(res);
      setCorrectedMaterial(res.material);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function proceedToBatch() {
    navigate("/batches/new", {
      state: {
        material_type: correctedMaterial,
        confidence: result.confidence,
        recyclability: result.recyclability,
        image_url: previewUrl,
        was_corrected: correctedMaterial !== result.material,
      },
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <span className="badge bg-moss-100 text-moss-700 mb-3">Step 1 of 6</span>
      <h1 className="text-3xl font-semibold mb-2">AI Waste Scanner</h1>
      <p className="text-ink/65 mb-8">
        Upload a photo of the waste item. Our computer-vision layer will classify it into one
        of six material streams and estimate how recyclable it is.
      </p>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="card border-dashed border-2 border-moss-200 p-10 text-center cursor-pointer hover:border-moss-400 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {previewUrl ? (
          <img src={previewUrl} alt="preview" className="mx-auto max-h-64 rounded-xl object-contain" />
        ) : (
          <div className="text-ink/50">
            <p className="font-medium text-ink/70">Drag and drop an image here</p>
            <p className="text-sm mt-1">or click to browse - JPEG, PNG or WEBP</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button className="btn-primary" disabled={!file || loading} onClick={analyze}>
          {loading ? "Analyzing..." : "Analyze Waste"}
        </button>
        {file && (
          <button
            className="btn-secondary"
            onClick={() => {
              setFile(null);
              setPreviewUrl(null);
              setResult(null);
            }}
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          Could not classify this image: {error}
        </div>
      )}

      {result && (
        <div className="mt-8 card p-6">
          <h2 className="font-semibold text-lg mb-4">Classification result</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50 mb-1">Material</p>
              <p className="font-display font-semibold text-xl capitalize">{result.material}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50 mb-1">Confidence</p>
              <p className="font-display font-semibold text-xl">{Math.round(result.confidence * 100)}%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink/50 mb-1">Recyclability</p>
              <StatusBadge value={result.recyclability} />
            </div>
          </div>

          {result.needs_verification && (
            <div className="rounded-xl bg-clay-400/10 border border-clay-400/30 p-4 mb-5">
              <p className="text-sm font-medium text-clay-500 mb-2">
                Confidence is below our verification threshold. Please confirm or correct the material before creating a batch.
              </p>
              <div className="flex flex-wrap gap-2">
                {MATERIALS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setCorrectedMaterial(m)}
                    className={`px-3.5 py-1.5 rounded-full text-sm capitalize border transition-colors ${
                      correctedMaterial === m
                        ? "bg-moss-600 text-white border-moss-600"
                        : "bg-white border-moss-200 text-ink/70 hover:border-moss-400"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className="btn-primary" onClick={proceedToBatch}>
            Create Material Batch &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
