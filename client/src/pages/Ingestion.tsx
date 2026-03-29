import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const WORK_ARRANGEMENTS = [
  "",
  "On-site",
  "Hybrid",
  "Remote OK",
  "Remote Solely",
  "Hybrid,Remote OK,Remote Solely",
];

const EXPERIENCE_LEVELS = ["", "0-2", "2-5", "5-10", "10+", "0-2,2-5", "2-5,5-10"];

const EMPLOYMENT_TYPES = [
  "",
  "FULL_TIME",
  "PART_TIME",
  "CONTRACTOR",
  "TEMPORARY",
  "INTERN",
  "VOLUNTEER",
  "FULL_TIME,PART_TIME",
  "FULL_TIME,CONTRACTOR",
];

const ATS_SOURCES = [
  "",
  "greenhouse",
  "lever",
  "workday",
  "icims",
  "taleo",
  "bamboohr",
  "smartrecruiters",
  "ashby",
  "rippling",
  "workable",
  "successfactors",
  "oraclecloud",
  "personio",
  "teamtailor",
  "recruitee",
  "breezy",
];

const TAXONOMIES = [
  "Technology",
  "Healthcare",
  "Management & Leadership",
  "Finance & Accounting",
  "Human Resources",
  "Sales",
  "Marketing",
  "Customer Service & Support",
  "Education",
  "Legal",
  "Engineering",
  "Science & Research",
  "Data & Analytics",
  "Software",
  "Administrative",
  "Consulting",
];

type BooleanFilter = true | false | undefined;

const BoolToggle = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BooleanFilter;
  onChange: (v: BooleanFilter) => void;
}) => {
  const cycle = () => {
    if (value === undefined) onChange(true);
    else if (value === true) onChange(false);
    else onChange(undefined);
  };
  return (
    <button
      type="button"
      onClick={cycle}
      className="flex items-center gap-2 px-3 py-2 text-left transition-all"
      style={{
        background:
          value === true
            ? "oklch(0.65 0.18 145 / 0.15)"
            : value === false
            ? "oklch(0.5 0.22 27 / 0.15)"
            : "oklch(0.07 0 0)",
        border: `1.5px solid ${
          value === true
            ? "oklch(0.65 0.18 145)"
            : value === false
            ? "oklch(0.5 0.22 27)"
            : "oklch(0.2 0 0)"
        }`,
        minWidth: 0,
      }}
    >
      {value === true ? (
        <ToggleRight size={14} style={{ color: "oklch(0.65 0.18 145)", flexShrink: 0 }} />
      ) : value === false ? (
        <ToggleLeft size={14} style={{ color: "oklch(0.5 0.22 27)", flexShrink: 0 }} />
      ) : (
        <ToggleLeft size={14} style={{ color: "oklch(0.3 0 0)", flexShrink: 0 }} />
      )}
      <span
        style={{
          fontFamily: "var(--font-condensed)",
          fontSize: "0.7rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color:
            value === true
              ? "oklch(0.65 0.18 145)"
              : value === false
              ? "oklch(0.5 0.22 27)"
              : "oklch(0.4 0 0)",
        }}
      >
        {label}
        {value === true ? " = YES" : value === false ? " = NO" : " = ANY"}
      </span>
    </button>
  );
};

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label
    className="block mb-1"
    style={{
      fontFamily: "var(--font-condensed)",
      fontSize: "0.65rem",
      letterSpacing: "0.1em",
      color: "oklch(0.45 0 0)",
      textTransform: "uppercase",
    }}
  >
    {children}
  </label>
);

const SectionHeader = ({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex items-center justify-between w-full py-2"
    style={{ borderBottom: "1px solid oklch(0.15 0 0)" }}
  >
    <span
      style={{
        fontFamily: "var(--font-condensed)",
        fontSize: "0.7rem",
        letterSpacing: "0.12em",
        color: "oklch(0.5 0 0)",
        textTransform: "uppercase",
      }}
    >
      {title}
    </span>
    {open ? (
      <ChevronUp size={14} style={{ color: "oklch(0.4 0 0)" }} />
    ) : (
      <ChevronDown size={14} style={{ color: "oklch(0.4 0 0)" }} />
    )}
  </button>
);

export default function Ingestion() {
  const utils = trpc.useUtils();

  // ── Core filters (always visible) ──────────────────────────────────────────
  const [titleFilter, setTitleFilter] = useState("");
  const [advancedTitleFilter, setAdvancedTitleFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [source, setSource] = useState("");
  const [sourceExclusion, setSourceExclusion] = useState("");
  const [aiWorkArrangementFilter, setAiWorkArrangementFilter] = useState("");
  const [aiExperienceLevelFilter, setAiExperienceLevelFilter] = useState("");
  const [remote, setRemote] = useState<BooleanFilter>(undefined);
  const [agency, setAgency] = useState<BooleanFilter>(false); // default: exclude agencies
  const [aiVisaSponsorshipFilter, setAiVisaSponsorshipFilter] = useState<BooleanFilter>(undefined);
  const [limit, setLimit] = useState(100);

  // ── Advanced filters (collapsible) ─────────────────────────────────────────
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [advancedDescriptionFilter, setAdvancedDescriptionFilter] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("");
  const [organizationExclusionFilter, setOrganizationExclusionFilter] = useState("");
  const [advancedOrganizationFilter, setAdvancedOrganizationFilter] = useState("");
  const [aiEmploymentTypeFilter, setAiEmploymentTypeFilter] = useState("");
  const [aiTaxonomiesAFilter, setAiTaxonomiesAFilter] = useState("");
  const [aiTaxonomiesAPrimaryFilter, setAiTaxonomiesAPrimaryFilter] = useState("");
  const [aiTaxonomiesAExclusionFilter, setAiTaxonomiesAExclusionFilter] = useState("");
  const [aiHasSalary, setAiHasSalary] = useState<BooleanFilter>(undefined);
  const [includeLi, setIncludeLi] = useState<BooleanFilter>(undefined);
  const [liIndustryFilter, setLiIndustryFilter] = useState("");
  const [liOrganizationSlugFilter, setLiOrganizationSlugFilter] = useState("");
  const [liOrganizationSlugExclusionFilter, setLiOrganizationSlugExclusionFilter] = useState("");
  const [liOrganizationEmployeesGte, setLiOrganizationEmployeesGte] = useState("");
  const [liOrganizationEmployeesLte, setLiOrganizationEmployeesLte] = useState("");

  // ── Results ─────────────────────────────────────────────────────────────────
  const [fetchedJobs, setFetchedJobs] = useState<any[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());

  const { data: apiUsage, refetch: refetchUsage } = trpc.ingestion.getUsage.useQuery();

  const fetchJobs = trpc.ingestion.fetchJobs.useMutation({
    onSuccess: (data) => {
      // Active Jobs DB returns array directly or wrapped in data/jobs key
      const raw = data?.data ?? data?.jobs ?? data;
      const jobList = Array.isArray(raw) ? raw : [];
      setFetchedJobs(jobList);
      setSelectedJobs(new Set(jobList.map((_: any, i: number) => i)));
      refetchUsage();
      if (jobList.length === 0) {
        toast.info("No jobs returned — try broadening your filters");
      } else {
        toast.success(`Fetched ${jobList.length} jobs`);
      }
    },
    onError: (e) => toast.error(`API Error: ${e.message}`),
  });

  const batchIngest = trpc.jobs.batchIngest.useMutation({
    onSuccess: (data) => {
      toast.success(`Ingested ${data.count} jobs — LLM scoring in progress`);
      setFetchedJobs([]);
      setSelectedJobs(new Set());
      utils.jobs.kanban.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFetch = () => {
    fetchJobs.mutate({
      titleFilter: titleFilter || undefined,
      advancedTitleFilter: advancedTitleFilter || undefined,
      locationFilter: locationFilter || undefined,
      descriptionFilter: descriptionFilter || undefined,
      advancedDescriptionFilter: advancedDescriptionFilter || undefined,
      organizationFilter: organizationFilter || undefined,
      organizationExclusionFilter: organizationExclusionFilter || undefined,
      advancedOrganizationFilter: advancedOrganizationFilter || undefined,
      source: source || undefined,
      sourceExclusion: sourceExclusion || undefined,
      aiWorkArrangementFilter: aiWorkArrangementFilter || undefined,
      aiExperienceLevelFilter: aiExperienceLevelFilter || undefined,
      aiEmploymentTypeFilter: aiEmploymentTypeFilter || undefined,
      aiTaxonomiesAFilter: aiTaxonomiesAFilter || undefined,
      aiTaxonomiesAPrimaryFilter: aiTaxonomiesAPrimaryFilter || undefined,
      aiTaxonomiesAExclusionFilter: aiTaxonomiesAExclusionFilter || undefined,
      aiVisaSponsorshipFilter: aiVisaSponsorshipFilter,
      aiHasSalary: aiHasSalary,
      remote: remote,
      agency: agency,
      includeLi: includeLi,
      liOrganizationSlugFilter: liOrganizationSlugFilter || undefined,
      liOrganizationSlugExclusionFilter: liOrganizationSlugExclusionFilter || undefined,
      liIndustryFilter: liIndustryFilter || undefined,
      liOrganizationEmployeesGte: liOrganizationEmployeesGte || undefined,
      liOrganizationEmployeesLte: liOrganizationEmployeesLte || undefined,
      limit,
    });
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

  const selectAll = () => setSelectedJobs(new Set(fetchedJobs.map((_, i) => i)));
  const deselectAll = () => setSelectedJobs(new Set());

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2
              className="text-2xl font-black text-foreground"
              style={{ fontFamily: "var(--font-condensed)", letterSpacing: "0.05em" }}
            >
              Ingest Jobs
            </h2>
            <p
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                color: "oklch(0.35 0 0)",
                textTransform: "uppercase",
              }}
            >
              Active Jobs DB · active-ats-7d endpoint
            </p>
          </div>
          {apiUsage && (
            <div className="text-right">
              <p
                style={{
                  fontFamily: "var(--font-condensed)",
                  fontSize: "0.6rem",
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
                  fontSize: "1.4rem",
                  color: "oklch(0.98 0 0)",
                  fontWeight: "bold",
                  lineHeight: 1,
                }}
              >
                {apiUsage.callCount}
              </p>
            </div>
          )}
        </div>
        <div className="brutal-divider" />
      </div>

      <div className="flex-1 px-5 pb-5 space-y-4">
        {/* ── Core Filters ─────────────────────────────────────────────────── */}
        <div
          className="p-4 space-y-4"
          style={{ background: "oklch(0.06 0 0)", border: "1.5px solid oklch(0.15 0 0)" }}
        >
          <p
            style={{
              fontFamily: "var(--font-condensed)",
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              color: "oklch(0.5 0 0)",
              textTransform: "uppercase",
            }}
          >
            Core Filters
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Title Filter */}
            <div>
              <FieldLabel>Job Title (simple)</FieldLabel>
              <input
                className="brutal-input text-sm"
                placeholder='e.g. "Data Engineer"'
                value={titleFilter}
                onChange={(e) => { setTitleFilter(e.target.value); setAdvancedTitleFilter(""); }}
              />
            </div>

            {/* Advanced Title Filter */}
            <div>
              <FieldLabel>Advanced Title Filter</FieldLabel>
              <input
                className="brutal-input text-sm"
                placeholder="e.g. (React | Vue) & ! Junior"
                value={advancedTitleFilter}
                onChange={(e) => { setAdvancedTitleFilter(e.target.value); setTitleFilter(""); }}
              />
            </div>

            {/* Location */}
            <div>
              <FieldLabel>Location</FieldLabel>
              <input
                className="brutal-input text-sm"
                placeholder="e.g. United States OR United Kingdom"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>

            {/* ATS Source */}
            <div>
              <FieldLabel>ATS Source</FieldLabel>
              <select
                className="brutal-input text-sm"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                {ATS_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s || "— Any ATS —"}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Exclusion */}
            <div>
              <FieldLabel>Exclude ATS Source</FieldLabel>
              <input
                className="brutal-input text-sm"
                placeholder="e.g. linkedin,workday"
                value={sourceExclusion}
                onChange={(e) => setSourceExclusion(e.target.value)}
              />
            </div>

            {/* Work Arrangement */}
            <div>
              <FieldLabel>Work Arrangement (AI)</FieldLabel>
              <select
                className="brutal-input text-sm"
                value={aiWorkArrangementFilter}
                onChange={(e) => setAiWorkArrangementFilter(e.target.value)}
              >
                {WORK_ARRANGEMENTS.map((w) => (
                  <option key={w} value={w}>
                    {w || "— Any —"}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <FieldLabel>Experience Level (AI, years)</FieldLabel>
              <select
                className="brutal-input text-sm"
                value={aiExperienceLevelFilter}
                onChange={(e) => setAiExperienceLevelFilter(e.target.value)}
              >
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l || "— Any —"}
                  </option>
                ))}
              </select>
            </div>

            {/* Limit */}
            <div>
              <FieldLabel>Result Limit (max 100)</FieldLabel>
              <input
                className="brutal-input text-sm"
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={(e) => setLimit(Math.min(100, Math.max(1, Number(e.target.value))))}
              />
            </div>
          </div>

          {/* Boolean toggles row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <BoolToggle label="Remote" value={remote} onChange={setRemote} />
            <BoolToggle label="Agency / Staffing" value={agency} onChange={setAgency} />
            <BoolToggle label="Visa Sponsorship" value={aiVisaSponsorshipFilter} onChange={setAiVisaSponsorshipFilter} />
          </div>
        </div>

        {/* ── Advanced Filters (collapsible) ───────────────────────────────── */}
        <div
          className="p-4"
          style={{ background: "oklch(0.06 0 0)", border: "1.5px solid oklch(0.12 0 0)" }}
        >
          <SectionHeader
            title="Advanced Filters"
            open={showAdvanced}
            onToggle={() => setShowAdvanced((v) => !v)}
          />

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Description Filter */}
                <div>
                  <FieldLabel>Description Filter</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    placeholder="Keywords in job description"
                    value={descriptionFilter}
                    onChange={(e) => { setDescriptionFilter(e.target.value); setAdvancedDescriptionFilter(""); }}
                  />
                </div>

                {/* Advanced Description Filter */}
                <div>
                  <FieldLabel>Advanced Description Filter</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    placeholder="e.g. Python & (Django | FastAPI)"
                    value={advancedDescriptionFilter}
                    onChange={(e) => { setAdvancedDescriptionFilter(e.target.value); setDescriptionFilter(""); }}
                  />
                </div>

                {/* Organization Filter */}
                <div>
                  <FieldLabel>Company Filter (exact, comma-sep)</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    placeholder="e.g. Google,Microsoft"
                    value={organizationFilter}
                    onChange={(e) => { setOrganizationFilter(e.target.value); setAdvancedOrganizationFilter(""); }}
                  />
                </div>

                {/* Organization Exclusion */}
                <div>
                  <FieldLabel>Exclude Companies (exact, comma-sep)</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    placeholder="e.g. Amazon,Meta"
                    value={organizationExclusionFilter}
                    onChange={(e) => setOrganizationExclusionFilter(e.target.value)}
                  />
                </div>

                {/* Advanced Org Filter */}
                <div>
                  <FieldLabel>Advanced Company Filter</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    placeholder="e.g. University & ! Harvard"
                    value={advancedOrganizationFilter}
                    onChange={(e) => { setAdvancedOrganizationFilter(e.target.value); setOrganizationFilter(""); }}
                  />
                </div>

                {/* Employment Type */}
                <div>
                  <FieldLabel>Employment Type (AI)</FieldLabel>
                  <select
                    className="brutal-input text-sm"
                    value={aiEmploymentTypeFilter}
                    onChange={(e) => setAiEmploymentTypeFilter(e.target.value)}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t || "— Any —"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Taxonomy Filter */}
                <div>
                  <FieldLabel>Industry Taxonomy (AI, comma-sep)</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    placeholder="e.g. Technology,Software"
                    value={aiTaxonomiesAFilter}
                    onChange={(e) => setAiTaxonomiesAFilter(e.target.value)}
                    list="taxonomy-list"
                  />
                  <datalist id="taxonomy-list">
                    {TAXONOMIES.map((t) => <option key={t} value={t} />)}
                  </datalist>
                </div>

                {/* Primary Taxonomy */}
                <div>
                  <FieldLabel>Primary Taxonomy Only</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    placeholder="e.g. Technology"
                    value={aiTaxonomiesAPrimaryFilter}
                    onChange={(e) => setAiTaxonomiesAPrimaryFilter(e.target.value)}
                  />
                </div>

                {/* Taxonomy Exclusion */}
                <div>
                  <FieldLabel>Exclude Taxonomy</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    placeholder="e.g. Healthcare,Education"
                    value={aiTaxonomiesAExclusionFilter}
                    onChange={(e) => setAiTaxonomiesAExclusionFilter(e.target.value)}
                  />
                </div>

                {/* LinkedIn Industry */}
                <div>
                  <FieldLabel>LinkedIn Industry</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    placeholder="e.g. Computer Software"
                    value={liIndustryFilter}
                    onChange={(e) => setLiIndustryFilter(e.target.value)}
                  />
                </div>

                {/* LinkedIn Slug Filter */}
                <div>
                  <FieldLabel>LinkedIn Company Slug</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    placeholder="e.g. netflix,walmart"
                    value={liOrganizationSlugFilter}
                    onChange={(e) => setLiOrganizationSlugFilter(e.target.value)}
                  />
                </div>

                {/* LinkedIn Slug Exclusion */}
                <div>
                  <FieldLabel>Exclude LinkedIn Slug</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    placeholder="e.g. amazon,meta"
                    value={liOrganizationSlugExclusionFilter}
                    onChange={(e) => setLiOrganizationSlugExclusionFilter(e.target.value)}
                  />
                </div>

                {/* Employee Count */}
                <div>
                  <FieldLabel>Min Employees (≥)</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    type="number"
                    placeholder="e.g. 50"
                    value={liOrganizationEmployeesGte}
                    onChange={(e) => setLiOrganizationEmployeesGte(e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel>Max Employees (≤)</FieldLabel>
                  <input
                    className="brutal-input text-sm"
                    type="number"
                    placeholder="e.g. 5000"
                    value={liOrganizationEmployeesLte}
                    onChange={(e) => setLiOrganizationEmployeesLte(e.target.value)}
                  />
                </div>
              </div>

              {/* More boolean toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <BoolToggle label="Has Salary (AI)" value={aiHasSalary} onChange={setAiHasSalary} />
                <BoolToggle label="Include LinkedIn Data" value={includeLi} onChange={setIncludeLi} />
              </div>
            </div>
          )}
        </div>

        {/* ── Fetch Button ─────────────────────────────────────────────────── */}
        <button
          onClick={handleFetch}
          disabled={fetchJobs.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 font-black tracking-widest uppercase transition-all"
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: "0.9rem",
            letterSpacing: "0.12em",
            background: fetchJobs.isPending ? "oklch(0.15 0 0)" : "oklch(0.98 0 0)",
            color: fetchJobs.isPending ? "oklch(0.4 0 0)" : "oklch(0.04 0 0)",
            border: "2px solid oklch(0.98 0 0)",
          }}
        >
          {fetchJobs.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Fetching from Active Jobs DB...
            </>
          ) : (
            <>
              <Search size={16} />
              Fetch Jobs
            </>
          )}
        </button>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {fetchJobs.isError && (
          <div
            className="flex items-start gap-3 p-3"
            style={{ border: "1.5px solid oklch(0.5 0.22 27)", background: "oklch(0.5 0.22 27 / 0.08)" }}
          >
            <AlertCircle size={16} style={{ color: "oklch(0.5 0.22 27)", flexShrink: 0, marginTop: 2 }} />
            <p
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "0.75rem",
                letterSpacing: "0.06em",
                color: "oklch(0.7 0.1 27)",
              }}
            >
              {fetchJobs.error?.message}
            </p>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────────── */}
        {fetchedJobs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p
                style={{
                  fontFamily: "var(--font-condensed)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  color: "oklch(0.5 0 0)",
                  textTransform: "uppercase",
                }}
              >
                {fetchedJobs.length} jobs fetched · {selectedJobs.size} selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="px-2 py-1 text-xs"
                  style={{
                    fontFamily: "var(--font-condensed)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "oklch(0.6 0.15 200)",
                    border: "1px solid oklch(0.6 0.15 200)",
                    background: "transparent",
                    fontSize: "0.65rem",
                  }}
                >
                  All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-2 py-1 text-xs"
                  style={{
                    fontFamily: "var(--font-condensed)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "oklch(0.4 0 0)",
                    border: "1px solid oklch(0.2 0 0)",
                    background: "transparent",
                    fontSize: "0.65rem",
                  }}
                >
                  None
                </button>
              </div>
            </div>

            <div className="space-y-1 max-h-80 overflow-y-auto">
              {fetchedJobs.map((job: any, i: number) => {
                const title = job.title ?? job.job_title ?? "Untitled";
                const company = job.organization ?? job.company_name ?? job.company ?? "Unknown";
                const location = job.location ?? job.location_text ?? "";
                const src = job.source ?? job.ats_source ?? "";
                const isSelected = selectedJobs.has(i);
                return (
                  <div
                    key={i}
                    onClick={() => toggleJob(i)}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-all"
                    style={{
                      background: isSelected ? "oklch(0.1 0 0)" : "oklch(0.06 0 0)",
                      border: `1px solid ${isSelected ? "oklch(0.65 0.18 145)" : "oklch(0.12 0 0)"}`,
                    }}
                  >
                    <div
                      className="flex-shrink-0"
                      style={{
                        width: 12,
                        height: 12,
                        border: `2px solid ${isSelected ? "oklch(0.65 0.18 145)" : "oklch(0.3 0 0)"}`,
                        background: isSelected ? "oklch(0.65 0.18 145)" : "transparent",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{
                          fontFamily: "var(--font-condensed)",
                          fontSize: "0.8rem",
                          color: "oklch(0.9 0 0)",
                          fontWeight: 700,
                        }}
                      >
                        {title}
                      </p>
                      <p
                        className="truncate"
                        style={{
                          fontFamily: "var(--font-condensed)",
                          fontSize: "0.65rem",
                          color: "oklch(0.45 0 0)",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {company}
                        {location ? ` · ${location}` : ""}
                        {src ? ` · ${src}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleIngest}
              disabled={batchIngest.isPending || selectedJobs.size === 0}
              className="w-full flex items-center justify-center gap-2 py-3 font-black tracking-widest uppercase transition-all"
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "0.9rem",
                letterSpacing: "0.12em",
                background:
                  batchIngest.isPending || selectedJobs.size === 0
                    ? "oklch(0.1 0 0)"
                    : "oklch(0.5 0.22 27)",
                color:
                  batchIngest.isPending || selectedJobs.size === 0
                    ? "oklch(0.3 0 0)"
                    : "oklch(0.98 0 0)",
                border: `2px solid ${
                  batchIngest.isPending || selectedJobs.size === 0
                    ? "oklch(0.15 0 0)"
                    : "oklch(0.5 0.22 27)"
                }`,
              }}
            >
              {batchIngest.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Ingesting + LLM Scoring...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Ingest {selectedJobs.size} Selected Jobs
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
