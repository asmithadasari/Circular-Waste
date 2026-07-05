import { useEffect, useState } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { api } from "../api.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

const MOSS = "#3e8153";
const CLAY = "#c48a2b";
const PALETTE = ["#2c6941", "#5f9d70", "#c48a2b", "#8ebd98", "#1a3a26", "#d9a441"];

function StatCard({ label, value, suffix }) {
  return (
    <div className="card p-6">
      <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">{label}</p>
      <p className="font-display font-bold text-3xl text-moss-800">
        {value}
        {suffix && <span className="text-lg text-ink/40 ml-1">{suffix}</span>}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-6xl mx-auto px-6 py-16 text-ink/50">Loading ESG dashboard...</div>;
  if (error) return <div className="max-w-6xl mx-auto px-6 py-16 text-red-600">{error}</div>;

  const materials = Object.keys(data.waste_by_material);
  const hasData = materials.length > 0;

  const materialChart = {
    labels: materials.map((m) => m[0].toUpperCase() + m.slice(1)),
    datasets: [{ label: "kg", data: materials.map((m) => data.waste_by_material[m]), backgroundColor: PALETTE }],
  };

  const trendChart = {
    labels: data.diversion_trend.map((t) => t.date),
    datasets: [
      { label: "Processed (kg)", data: data.diversion_trend.map((t) => t.processed), borderColor: MOSS, backgroundColor: MOSS, tension: 0.3 },
      { label: "Diverted (kg)", data: data.diversion_trend.map((t) => t.diverted), borderColor: CLAY, backgroundColor: CLAY, tension: 0.3 },
    ],
  };

  const statusLabels = Object.keys(data.lifecycle_status_counts);
  const statusChart = {
    labels: statusLabels.map((s) => s.replace(/_/g, " ")),
    datasets: [{ data: statusLabels.map((s) => data.lifecycle_status_counts[s]), backgroundColor: PALETTE }],
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-14">
      <span className="badge bg-moss-100 text-moss-700 mb-3">Step 5 of 6</span>
      <h1 className="text-3xl font-semibold mb-2">ESG Intelligence Dashboard</h1>
      <p className="text-ink/65 mb-8">Live metrics computed from real batch and traceability records - nothing here is invented.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard label="Total waste processed" value={data.total_waste_processed_kg} suffix="kg" />
        <StatCard label="Diverted from landfill" value={data.waste_diverted_kg} suffix="kg" />
        <StatCard label="Diversion rate" value={data.diversion_rate_percent} suffix="%" />
        <StatCard label="Active batches" value={data.active_batches} />
      </div>

      {!hasData ? (
        <div className="card p-10 text-center text-ink/60">
          No batches yet. Scan a waste item and create a batch to populate the dashboard.
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5 mb-8">
          <div className="card p-6 lg:col-span-1">
            <h3 className="font-semibold mb-4">Waste by Material</h3>
            <Doughnut data={materialChart} options={{ plugins: { legend: { position: "bottom" } } }} />
          </div>
          <div className="card p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4">Diversion Trend</h3>
            <Line data={trendChart} options={{ plugins: { legend: { position: "bottom" } }, responsive: true }} />
          </div>
          <div className="card p-6 lg:col-span-3">
            <h3 className="font-semibold mb-4">Batch Lifecycle Status</h3>
            <Bar
              data={statusChart}
              options={{ indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }}
            />
          </div>
        </div>
      )}

      <div className="card p-6 border-l-4 border-l-clay-500">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs uppercase tracking-wide text-clay-500 font-semibold">ReLoop Insight</p>
          {data.insight_source && (
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
              data.insight_source === "llm" 
                ? "bg-moss-100 text-moss-700" 
                : "bg-clay-100 text-clay-700"
            }`}>
              {data.insight_source === "llm" ? "AI Generated" : "Deterministic"}
            </span>
          )}
        </div>
        <p className="text-ink/80">{data.insight}</p>
      </div>
    </div>
  );
}
