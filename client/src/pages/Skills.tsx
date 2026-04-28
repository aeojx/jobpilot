import { trpc } from "@/lib/trpc";
import { Loader2, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const MONO = "Press Start 2P, monospace";
const LABEL_STYLE = {
  fontFamily: MONO,
  fontSize: "0.6rem",
  letterSpacing: "0.12em",
  color: "oklch(0.55 0 0)",
  textTransform: "uppercase" as const,
};
const SECTION_STYLE = {
  fontFamily: MONO,
  fontSize: "0.65rem",
  letterSpacing: "0.12em",
  color: "var(--atari-cyan)",
  textTransform: "uppercase" as const,
};

function TagInput({
  label,
  values,
  onChange,
  placeholder,
  color = "var(--atari-cyan)",
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  color?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) {
      onChange([...values, v]);
      setDraft("");
    }
  };

  return (
    <div>
      <label style={LABEL_STYLE}>{label}</label>
      <div className="flex gap-2 mt-1">
        <input
          className="brutal-input flex-1 text-xs"
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
          }}
          placeholder={placeholder ?? "Type and press Enter"}
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-1 flex items-center gap-1"
          style={{
            fontFamily: MONO,
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            background: "transparent",
            color,
            border: `1px solid ${color}`,
          }}
        >
          <Plus size={10} /> ADD
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {values.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1 px-2 py-1"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.65rem",
                background: "oklch(0.08 0 0)",
                border: `1px solid ${color}`,
                color,
              }}
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                style={{ color, lineHeight: 1 }}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function WeightSlider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label style={{ ...LABEL_STYLE, fontSize: "0.55rem" }}>{label}</label>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color }}
      />
    </div>
  );
}

export default function Skills() {
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.skills.get.useQuery();

  // Structured fields
  const [content, setContent] = useState("");
  const [mustHave, setMustHave] = useState<string[]>([]);
  const [niceToHave, setNiceToHave] = useState<string[]>([]);
  const [dealbreakers, setDealbreakers] = useState<string[]>([]);
  const [seniority, setSeniority] = useState("");
  const [salaryMin, setSalaryMin] = useState<string>("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [remote, setRemote] = useState<"remote" | "hybrid" | "onsite" | "any">("any");

  // Dimension weights
  const [wSkills, setWSkills] = useState(40);
  const [wSeniority, setWseniority] = useState(20);
  const [wLocation, setWLocation] = useState(20);
  const [wIndustry, setWIndustry] = useState(10);
  const [wComp, setWComp] = useState(10);

  const totalWeight = wSkills + wSeniority + wLocation + wIndustry + wComp;

  useEffect(() => {
    if (!profile) return;
    setContent(profile.content ?? "");
    setMustHave((profile.mustHaveSkills as string[]) ?? []);
    setNiceToHave((profile.niceToHaveSkills as string[]) ?? []);
    setDealbreakers((profile.dealbreakers as string[]) ?? []);
    setSeniority(profile.seniority ?? "");
    setSalaryMin(profile.salaryMin ? String(profile.salaryMin) : "");
    setIndustries((profile.targetIndustries as string[]) ?? []);
    setRemote((profile.remotePreference as "remote" | "hybrid" | "onsite" | "any") ?? "any");
    setWSkills(profile.weightSkills ?? 40);
    setWseniority(profile.weightSeniority ?? 20);
    setWLocation(profile.weightLocation ?? 20);
    setWIndustry(profile.weightIndustry ?? 10);
    setWComp(profile.weightCompensation ?? 10);
  }, [profile]);

  const upsert = trpc.skills.upsert.useMutation({
    onSuccess: () => {
      toast.success("Skills profile saved");
      utils.skills.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const rescore = trpc.skills.rescoreAll.useMutation({
    onSuccess: (data) => {
      const msg = data.skipped > 0
        ? `Re-scored ${data.updated} jobs (${data.skipped} already scored, skipped)`
        : `Re-scored ${data.updated} jobs`;
      toast.success(msg);
      utils.jobs.kanban.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (totalWeight !== 100) {
      toast.error(`Dimension weights must sum to 100 (currently ${totalWeight})`);
      return;
    }
    upsert.mutate({
      content,
      mustHaveSkills: mustHave,
      niceToHaveSkills: niceToHave,
      dealbreakers,
      seniority: seniority || undefined,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      targetIndustries: industries,
      remotePreference: remote,
      weightSkills: wSkills,
      weightSeniority: wSeniority,
      weightLocation: wLocation,
      weightIndustry: wIndustry,
      weightCompensation: wComp,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" style={{ color: "var(--atari-cyan)" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: MONO, letterSpacing: "0.05em" }}>
            Skills Profile
          </h2>
          {profile && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "oklch(0.35 0 0)" }}>
              Updated {new Date(profile.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="atari-divider" />
        <p className="mt-2" style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.08em", color: "var(--atari-gray)", textTransform: "uppercase" }}>
          Configure your profile — the LLM uses every field to score jobs across 5 dimensions
        </p>
      </div>

      <div className="flex-1 px-5 pb-5 space-y-6">

        {/* ── Section 1: Skills ── */}
        <div className="space-y-4">
          <p style={SECTION_STYLE}>① Skills</p>
          <TagInput
            label="Must-Have Skills (required — heavily penalises if missing)"
            values={mustHave}
            onChange={setMustHave}
            placeholder="e.g. TypeScript, React, SQL"
            color="var(--atari-cyan)"
          />
          <TagInput
            label="Nice-to-Have Skills (bonus — rewards if present)"
            values={niceToHave}
            onChange={setNiceToHave}
            placeholder="e.g. GraphQL, Docker, Terraform"
            color="var(--atari-amber)"
          />
        </div>

        {/* ── Section 2: Dealbreakers ── */}
        <div className="space-y-2">
          <p style={SECTION_STYLE}>② Dealbreakers (auto-reject before LLM scoring)</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "oklch(0.4 0 0)" }}>
            Any job containing these keywords is immediately rejected — no LLM call is made, saving API quota.
          </p>
          <TagInput
            label="Dealbreaker Keywords"
            values={dealbreakers}
            onChange={setDealbreakers}
            placeholder="e.g. security clearance, on-site only, US citizen"
            color="oklch(0.65 0.22 27)"
          />
        </div>

        {/* ── Section 3: Seniority & Compensation ── */}
        <div className="space-y-4">
          <p style={SECTION_STYLE}>③ Seniority & Compensation</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={LABEL_STYLE}>Target Seniority Level</label>
              <select
                className="brutal-input w-full mt-1"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
              >
                <option value="">Any level</option>
                <option value="Junior">Junior / Entry-Level</option>
                <option value="Mid">Mid-Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead / Principal</option>
                <option value="Staff">Staff</option>
                <option value="Director">Director</option>
                <option value="VP">VP / C-Suite</option>
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Minimum Salary (USD/year)</label>
              <input
                type="number"
                className="brutal-input w-full mt-1"
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
                placeholder="e.g. 120000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Section 4: Industries & Location ── */}
        <div className="space-y-4">
          <p style={SECTION_STYLE}>④ Industries & Location</p>
          <TagInput
            label="Target Industries (leave empty for any)"
            values={industries}
            onChange={setIndustries}
            placeholder="e.g. FinTech, SaaS, Healthcare"
            color="oklch(0.7 0.18 145)"
          />
          <div>
            <label style={LABEL_STYLE}>Remote Preference</label>
            <div className="flex gap-2 mt-1">
              {(["any", "remote", "hybrid", "onsite"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRemote(opt)}
                  className="flex-1 py-2 text-xs uppercase tracking-widest"
                  style={{
                    fontFamily: MONO,
                    fontSize: "0.55rem",
                    letterSpacing: "0.1em",
                    background: remote === opt ? "var(--atari-cyan)" : "transparent",
                    color: remote === opt ? "var(--atari-black)" : "var(--atari-cyan)",
                    border: "1px solid var(--atari-cyan)",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 5: Dimension Weights ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p style={SECTION_STYLE}>⑤ Dimension Weights</p>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                color: totalWeight === 100 ? "oklch(0.7 0.18 145)" : "oklch(0.65 0.22 27)",
              }}
            >
              Total: {totalWeight}% {totalWeight !== 100 ? "⚠ must equal 100" : "✓"}
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "oklch(0.4 0 0)" }}>
            Controls how much each dimension contributes to the composite match score.
          </p>
          <WeightSlider label="Skills Match" value={wSkills} onChange={setWSkills} color="var(--atari-cyan)" />
          <WeightSlider label="Seniority Fit" value={wSeniority} onChange={setWseniority} color="var(--atari-amber)" />
          <WeightSlider label="Location / Remote" value={wLocation} onChange={setWLocation} color="oklch(0.7 0.18 145)" />
          <WeightSlider label="Industry Fit" value={wIndustry} onChange={setWIndustry} color="oklch(0.75 0.18 290)" />
          <WeightSlider label="Compensation" value={wComp} onChange={setWComp} color="oklch(0.65 0.22 27)" />
        </div>

        {/* ── Section 6: Background / Freetext ── */}
        <div>
          <p style={SECTION_STYLE}>⑥ Background Narrative (optional)</p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "oklch(0.4 0 0)", marginBottom: 6 }}>
            Free-text context sent to the LLM alongside the structured fields above. Describe your experience, achievements, or anything that doesn't fit in the tags above.
          </p>
          <textarea
            className="brutal-input font-mono text-sm w-full"
            rows={8}
            placeholder={`e.g. 8 years building fintech products at Series B–D startups. Led teams of 5–12 engineers. Strong in distributed systems and data pipelines. Looking for roles where I can own architecture decisions.`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", resize: "vertical" }}
          />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "oklch(0.3 0 0)", marginTop: 4 }}>
            {content.length} characters · {content.split(/\s+/).filter(Boolean).length} words
          </p>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={upsert.isPending || totalWeight !== 100}
            className="flex-1 py-3 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
            style={{
              fontFamily: MONO,
              letterSpacing: "0.15em",
              background: totalWeight !== 100 ? "oklch(0.2 0 0)" : "var(--atari-white)",
              color: totalWeight !== 100 ? "oklch(0.4 0 0)" : "var(--atari-black)",
              border: `2px solid ${totalWeight !== 100 ? "oklch(0.3 0 0)" : "var(--atari-white)"}`,
              cursor: totalWeight !== 100 ? "not-allowed" : "pointer",
            }}
          >
            {upsert.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Profile</>}
          </button>

          <button
            onClick={() => rescore.mutate({ forceRescore: false })}
            disabled={rescore.isPending || !profile}
            className="py-3 px-4 font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
            style={{
              fontFamily: MONO,
              letterSpacing: "0.1em",
              background: "transparent",
              color: "var(--atari-amber)",
              border: "2px solid var(--atari-amber)",
            }}
            title="Re-score all existing jobs with current skills profile"
          >
            {rescore.isPending ? <><Loader2 size={14} className="animate-spin" /> Scoring...</> : <><RefreshCw size={14} /> Re-score All</>}
          </button>
        </div>

        {rescore.isPending && (
          <div className="p-3" style={{ background: "oklch(0.08 0 0)", border: "1px solid oklch(0.5 0.22 27 / 0.3)" }}>
            <p style={{ fontFamily: MONO, fontSize: "0.7rem", letterSpacing: "0.08em", color: "var(--atari-amber)", textTransform: "uppercase" }}>
              LLM is scoring all jobs across 5 dimensions... this may take a moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
