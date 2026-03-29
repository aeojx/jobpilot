import { trpc } from "@/lib/trpc";
import { AlertCircle, Download, Loader2, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const WORK_ARRANGEMENTS = ["Remote", "Hybrid", "On-site", ""];
const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior Level", "Director", "Executive", ""];
const ATS_SOURCES = ["greenhouse", "lever", "workday", "icims", "taleo", "bamboohr", "smartrecruiters", ""];

export default function Ingestion() {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    jobTitle: "",
    location: "",
    industry: "",
    workArrangement: "",
    experienceLevel: "",
    atsSource: "",
    excludeAgency: false,
    visaSponsorship: false,
    excludeLinkedIn: true,
  });
  const [fetchedJobs, setFetchedJobs] = useState<any[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());

  const { data: apiUsage, refetch: refetchUsage } = trpc.ingestion.getUsage.useQuery();

  const fetchJobs = trpc.ingestion.fetchJobs.useMutation({
    onSuccess: (data) => {
      const jobs = data?.jobs ?? data?.data ?? data ?? [];
      const jobList = Array.isArray(jobs) ? jobs : [];
      setFetchedJobs(jobList);
      setSelectedJobs(new Set(jobList.map((_: any, i: number) => i)));
      refetchUsage();
      toast.success(`Fetched ${jobList.length} jobs`);
    },
    onError: (e) => toast.error(`API Error: ${e.message}`),
  });

  const batchIngest = trpc.jobs.batchIngest.useMutation({
    onSuccess: (data) => {
      toast.success(`Ingested ${data.count} jobs`);
      setFetchedJobs([]);
      setSelectedJobs(new Set());
      utils.jobs.kanban.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFetch = () => {
    fetchJobs.mutate({ ...form });
  };

  const handleIngest = () => {
    const toIngest = fetchedJobs.filter((_, i) => selectedJobs.has(i));
    if (toIngest.length === 0) {
      toast.error("Select at least one job to ingest");
      return;
    }
    batchIngest.mutate({ jobs: toIngest });
  };

  const toggleJob = (i: number) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-condensed)", letterSpacing: "0.05em" }}
          >
            Ingest Jobs
          </h2>
          {apiUsage && (
            <div className="text-right">
              <p
                style={{
                  fontFamily: "var(--font-condensed)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  color: "oklch(0.4 0 0)",
                  textTransform: "uppercase",
                }}
              >
                API Calls This Month
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.2rem",
                  color: "oklch(0.98 0 0)",
                  fontWeight: "bold",
                }}
              >
                {apiUsage.callCount}
              </p>
            </div>
          )}
        </div>
        <div className="brutal-divider" />
      </div>

      <div className="flex-1 px-5 pb-5 space-y-5">
        {/* Filter Form */}
        <div
          className="p-4 space-y-4"
          style={{ background: "oklch(0.06 0 0)", border: "1.5px solid oklch(0.15 0 0)" }}
        >
          <p
            style={{
              fontFamily: "var(--font-condensed)",
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              color: "oklch(0.4 0 0)",
              textTransform: "uppercase",
            }}
          >
            Search Filters
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Job Title */}
            <div>
              <label className="block mb-1" style={{ fontFamily: "var(--font-condensed)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "oklch(0.45 0 0)", textTransform: "uppercase" }}>
                Job Title
              </label>
              <input
                className="brutal-input text-sm"
                placeholder="e.g. Software Engineer"
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block mb-1" style={{ fontFamily: "var(--font-condensed)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "oklch(0.45 0 0)", textTransform: "uppercase" }}>
                Location
              </label>
              <input
                className="brutal-input text-sm"
                placeholder="e.g. New York, NY"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block mb-1" style={{ fontFamily: "var(--font-condensed)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "oklch(0.45 0 0)", textTransform: "uppercase" }}>
                Industry / Taxonomy
              </label>
              <input
                className="brutal-input text-sm"
                placeholder="e.g. Technology, Finance"
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
              />
            </div>

            {/* Work Arrangement */}
            <div>
              <label className="block mb-1" style={{ fontFamily: "var(--font-condensed)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "oklch(0.45 0 0)", textTransform: "uppercase" }}>
                Work Arrangement
              </label>
              <select
                className="brutal-input text-sm"
                value={form.workArrangement}
                onChange={(e) => setForm((f) => ({ ...f, workArrangement: e.target.value }))}
                style={{ background: "oklch(0.07 0 0)", color: "oklch(0.98 0 0)" }}
              >
                <option value="">Any</option>
                {WORK_ARRANGEMENTS.filter(Boolean).map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block mb-1" style={{ fontFamily: "var(--font-condensed)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "oklch(0.45 0 0)", textTransform: "uppercase" }}>
                Experience Level
              </label>
              <select
                className="brutal-input text-sm"
                value={form.experienceLevel}
                onChange={(e) => setForm((f) => ({ ...f, experienceLevel: e.target.value }))}
                style={{ background: "oklch(0.07 0 0)", color: "oklch(0.98 0 0)" }}
              >
                <option value="">Any</option>
                {EXPERIENCE_LEVELS.filter(Boolean).map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* ATS Source */}
            <div>
              <label className="block mb-1" style={{ fontFamily: "var(--font-condensed)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "oklch(0.45 0 0)", textTransform: "uppercase" }}>
                ATS Source
              </label>
              <select
                className="brutal-input text-sm"
                value={form.atsSource}
                onChange={(e) => setForm((f) => ({ ...f, atsSource: e.target.value }))}
                style={{ background: "oklch(0.07 0 0)", color: "oklch(0.98 0 0)" }}
              >
                <option value="">Any</option>
                {ATS_SOURCES.filter(Boolean).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-4 pt-1">
            {[
              { key: "excludeAgency", label: "Exclude Agencies" },
              { key: "visaSponsorship", label: "Visa Sponsorship" },
              { key: "excludeLinkedIn", label: "Exclude LinkedIn" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                  style={{ accentColor: "oklch(0.5 0.22 27)", width: 14, height: 14 }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontSize: "0.75rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "oklch(0.65 0 0)",
                  }}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>

          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "oklch(0.3 0 0)",
            }}
          >
            Defaults: limit=100, include_ai=true, description_type=text
          </p>
        </div>

        {/* Fetch Button */}
        <button
          onClick={handleFetch}
          disabled={fetchJobs.isPending}
          className="w-full py-3 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
          style={{
            fontFamily: "var(--font-condensed)",
            letterSpacing: "0.2em",
            background: "oklch(0.98 0 0)",
            color: "oklch(0.04 0 0)",
            border: "2px solid oklch(0.98 0 0)",
          }}
        >
          {fetchJobs.isPending ? (
            <><Loader2 size={16} className="animate-spin" /> Fetching...</>
          ) : (
            <><Search size={16} /> Fetch Jobs from API</>
          )}
        </button>

        {/* Results */}
        {fetchedJobs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p
                style={{
                  fontFamily: "var(--font-condensed)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  color: "oklch(0.55 0 0)",
                  textTransform: "uppercase",
                }}
              >
                {selectedJobs.size} / {fetchedJobs.length} Selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedJobs(new Set(fetchedJobs.map((_, i) => i)))}
                  className="px-3 py-1 text-xs font-bold uppercase tracking-widest"
                  style={{
                    fontFamily: "var(--font-condensed)",
                    background: "transparent",
                    border: "1px solid oklch(0.3 0 0)",
                    color: "oklch(0.55 0 0)",
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedJobs(new Set())}
                  className="px-3 py-1 text-xs font-bold uppercase tracking-widest"
                  style={{
                    fontFamily: "var(--font-condensed)",
                    background: "transparent",
                    border: "1px solid oklch(0.3 0 0)",
                    color: "oklch(0.55 0 0)",
                  }}
                >
                  None
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {fetchedJobs.map((job: any, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 p-3 cursor-pointer transition-colors"
                  style={{
                    background: selectedJobs.has(i) ? "oklch(0.1 0 0)" : "oklch(0.06 0 0)",
                    border: `1.5px solid ${selectedJobs.has(i) ? "oklch(0.5 0.22 27)" : "oklch(0.15 0 0)"}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedJobs.has(i)}
                    onChange={() => toggleJob(i)}
                    style={{ accentColor: "oklch(0.5 0.22 27)", marginTop: 2, flexShrink: 0 }}
                  />
                  <div className="min-w-0">
                    <p
                      className="font-bold leading-tight"
                      style={{ fontFamily: "var(--font-condensed)", fontSize: "0.85rem", color: "oklch(0.98 0 0)" }}
                    >
                      {job.title ?? "Untitled"}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-condensed)",
                        fontSize: "0.7rem",
                        color: "oklch(0.5 0 0)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {job.company_name ?? job.company ?? "Unknown"} · {job.location ?? ""}
                    </p>
                  </div>
                  {job.source && (
                    <span
                      className="brutal-tag flex-shrink-0"
                      style={{ borderColor: "oklch(0.6 0.15 200)", color: "oklch(0.6 0.15 200)" }}
                    >
                      {job.source}
                    </span>
                  )}
                </label>
              ))}
            </div>

            <button
              onClick={handleIngest}
              disabled={batchIngest.isPending || selectedJobs.size === 0}
              className="w-full mt-3 py-3 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
              style={{
                fontFamily: "var(--font-condensed)",
                letterSpacing: "0.15em",
                background: "oklch(0.5 0.22 27)",
                color: "oklch(0.98 0 0)",
                border: "2px solid oklch(0.5 0.22 27)",
              }}
            >
              {batchIngest.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Ingesting & Scoring...</>
              ) : (
                <><Download size={16} /> Ingest {selectedJobs.size} Jobs</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
