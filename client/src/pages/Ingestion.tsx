import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ChevronsUpDown,
  Play,
  Plus,
  RefreshCw,
  Timer,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ── API Constants ─────────────────────────────────────────────────────────────

const ATS_SOURCES = [
  "adp","applicantpro","ashby","bamboohr","breezy","careerplug","comeet","csod",
  "dayforce","dover","eightfold","firststage","freshteam","gem","gohire","greenhouse",
  "hibob","hirebridge","hirehive","hireology","hiringthing","icims","isolved","jazzhr",
  "jobvite","join.com","kula","lever.co","manatal","oraclecloud","pageup","paradox",
  "paycom","paycor","paylocity","personio","phenompeople","pinpoint","polymer","recruitee",
  "recooty","rippling","rival","smartrecruiters","successfactors","taleo","teamtailor",
  "trakstar","trinet","ultipro","werecruit","workable","workday","zoho",
];

const WORK_ARRANGEMENTS = ["On-site", "Hybrid", "Remote OK", "Remote Solely"];
const EXPERIENCE_LEVELS = ["0-2", "2-5", "5-10", "10+"];
const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACTOR", "TEMPORARY", "INTERN", "VOLUNTEER", "PER_DIEM", "OTHER"];
const TAXONOMIES = [
  "Technology","Healthcare","Management & Leadership","Finance & Accounting","Human Resources",
  "Sales","Marketing","Customer Service & Support","Education","Legal","Engineering",
  "Science & Research","Trades","Construction","Manufacturing","Logistics","Creative & Media",
  "Hospitality","Environmental & Sustainability","Retail","Data & Analytics","Software",
  "Energy","Agriculture","Social Services","Administrative","Government & Public Sector",
  "Art & Design","Food & Beverage","Transportation","Consulting","Sports & Recreation","Security & Safety",
];
const DAYS_OF_WEEK = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// Common location suggestions for autocomplete
const LOCATION_SUGGESTIONS = [
  "United States","United Kingdom","Canada","Australia","Germany","France","Netherlands",
  "Singapore","India","Ireland","New Zealand","Switzerland","Sweden","Norway","Denmark",
  "Remote","New York","San Francisco","London","Toronto","Sydney","Berlin","Amsterdam",
  "Dubai","Austin","Seattle","Chicago","Boston","Los Angeles","Atlanta","Miami",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

type TriState = true | false | undefined;

function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/** Autocomplete combobox for text fields with suggestions */
function AutocompleteInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const filtered = value
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions;

  return (
    <div>
      <label className="block text-xs font-mono text-amber-400 mb-1">{label}</label>
      <Popover open={open && !disabled} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => { onChange(e.target.value); setOpen(true); }}
              onFocus={() => !disabled && setOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full px-3 py-2 pr-8 text-xs font-mono bg-black border-2 border-gray-700 focus:border-amber-400 outline-none transition-colors text-white disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <ChevronsUpDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>
        </PopoverTrigger>
        {filtered.length > 0 && (
          <PopoverContent
            className="p-0 bg-black border-2 border-amber-400"
            style={{ width: "var(--radix-popover-trigger-width)" }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandList>
                <CommandEmpty>
                  <span className="text-xs font-mono text-gray-500 px-3 py-2 block">No matches</span>
                </CommandEmpty>
                <CommandGroup>
                  {filtered.slice(0, 12).map((s) => (
                    <CommandItem
                      key={s}
                      value={s}
                      onSelect={() => { onChange(s); setOpen(false); }}
                      className="text-xs font-mono text-gray-300 hover:text-amber-400 hover:bg-amber-400/10 cursor-pointer"
                    >
                      <Check
                        size={10}
                        className={`mr-2 ${value === s ? "opacity-100 text-amber-400" : "opacity-0"}`}
                      />
                      {s}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}

/** Multi-select dropdown with search */
function MultiSelect({
  label, options, selected, onChange, placeholder, disabled,
}: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
  placeholder?: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt));
    else onChange([...selected, opt]);
  };
  return (
    <div>
      <label className="block text-xs font-mono text-amber-400 mb-1">{label}</label>
      <Popover open={open && !disabled} onOpenChange={(o) => !disabled && setOpen(o)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="w-full px-3 py-2 text-xs font-mono text-left bg-black border-2 border-gray-700 hover:border-amber-400 transition-colors flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className={selected.length ? "text-white truncate max-w-[80%]" : "text-gray-500"}>
              {selected.length
                ? selected.length === 1 ? selected[0] : `${selected.length} selected`
                : placeholder ?? "Select…"}
            </span>
            <ChevronDown size={12} className="shrink-0 ml-1 text-gray-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 bg-black border-2 border-amber-400"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command>
            <CommandInput placeholder="Search…" className="text-xs font-mono h-8 border-b border-gray-700" />
            <CommandList className="max-h-52">
              <CommandEmpty>
                <span className="text-xs font-mono text-gray-500 px-3 py-2 block">No results</span>
              </CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={() => toggle(opt)}
                    className="text-xs font-mono cursor-pointer"
                  >
                    <div
                      className={`w-3 h-3 border mr-2 shrink-0 flex items-center justify-center ${
                        selected.includes(opt) ? "border-amber-400 bg-amber-400" : "border-gray-600"
                      }`}
                    >
                      {selected.includes(opt) && <Check size={8} className="text-black" />}
                    </div>
                    <span className={selected.includes(opt) ? "text-amber-400" : "text-gray-300"}>{opt}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {selected.length > 0 && (
            <div className="border-t border-gray-700 px-3 py-1.5 flex justify-between items-center">
              <span className="text-xs text-amber-400 font-mono">{selected.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-gray-500 hover:text-red-400 font-mono transition-colors"
              >
                CLEAR
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Single-select dropdown */
function SelectInput({
  label, options, value, onChange, placeholder, disabled,
}: {
  label: string; options: { value: string; label: string }[]; value: string;
  onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-amber-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 text-xs font-mono bg-black border-2 border-gray-700 focus:border-amber-400 outline-none text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-amber-400 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 text-xs font-mono bg-black border-2 border-gray-700 focus:border-amber-400 outline-none transition-colors text-white disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function TriToggle({ label, value, onChange, disabled }: {
  label: string; value: TriState; onChange: (v: TriState) => void; disabled?: boolean;
}) {
  const cycle = () => {
    if (disabled) return;
    if (value === undefined) onChange(true);
    else if (value === true) onChange(false);
    else onChange(undefined);
  };
  return (
    <button
      type="button"
      onClick={cycle}
      disabled={disabled}
      className={`px-3 py-1.5 text-xs font-mono border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
        value === true ? "border-green-400 text-green-400 bg-green-400/10" :
        value === false ? "border-red-400 text-red-400 bg-red-400/10" :
        "border-gray-600 text-gray-500"
      }`}
    >
      {label}: {value === true ? "YES" : value === false ? "NO" : "ANY"}
    </button>
  );
}

// ── Default filter state ──────────────────────────────────────────────────────

const defaultFilters = () => ({
  endpoint: "active-ats-7d" as "active-ats-7d" | "active-ats-24h",
  titleFilter: "",
  advancedTitleFilter: "",
  locationFilter: "",
  descriptionFilter: "",
  organizationFilter: "",
  organizationExclusionFilter: "",
  source: [] as string[],
  sourceExclusion: [] as string[],
  aiWorkArrangementFilter: [] as string[],
  aiExperienceLevelFilter: [] as string[],
  aiEmploymentTypeFilter: [] as string[],
  aiTaxonomiesAFilter: [] as string[],
  aiTaxonomiesAExclusionFilter: [] as string[],
  aiVisaSponsorshipFilter: undefined as TriState,
  aiHasSalary: undefined as TriState,
  remote: undefined as TriState,
  agency: undefined as TriState,
  includeLi: undefined as TriState,
  liIndustryFilter: "",
  liOrganizationSlugFilter: "",
  liOrganizationSlugExclusionFilter: "",
  liOrganizationEmployeesGte: "",
  liOrganizationEmployeesLte: "",
  dateFilter: "",
  limit: "100",
  offset: "0",
  descriptionType: "text" as "text" | "html",
});

type Filters = ReturnType<typeof defaultFilters>;

function filtersToInput(f: Filters) {
  return {
    endpoint: f.endpoint,
    titleFilter: f.titleFilter || undefined,
    advancedTitleFilter: f.advancedTitleFilter || undefined,
    locationFilter: f.locationFilter || undefined,
    descriptionFilter: f.descriptionFilter || undefined,
    organizationFilter: f.organizationFilter || undefined,
    organizationExclusionFilter: f.organizationExclusionFilter || undefined,
    source: f.source.length ? f.source.join(",") : undefined,
    sourceExclusion: f.sourceExclusion.length ? f.sourceExclusion.join(",") : undefined,
    aiWorkArrangementFilter: f.aiWorkArrangementFilter.length ? f.aiWorkArrangementFilter.join(",") : undefined,
    aiExperienceLevelFilter: f.aiExperienceLevelFilter.length ? f.aiExperienceLevelFilter.join(",") : undefined,
    aiEmploymentTypeFilter: f.aiEmploymentTypeFilter.length ? f.aiEmploymentTypeFilter.join(",") : undefined,
    aiTaxonomiesAFilter: f.aiTaxonomiesAFilter.length ? f.aiTaxonomiesAFilter.join(",") : undefined,
    aiTaxonomiesAExclusionFilter: f.aiTaxonomiesAExclusionFilter.length ? f.aiTaxonomiesAExclusionFilter.join(",") : undefined,
    aiVisaSponsorshipFilter: f.aiVisaSponsorshipFilter,
    aiHasSalary: f.aiHasSalary,
    remote: f.remote,
    agency: f.agency,
    includeLi: f.includeLi,
    liIndustryFilter: f.liIndustryFilter || undefined,
    liOrganizationSlugFilter: f.liOrganizationSlugFilter || undefined,
    liOrganizationSlugExclusionFilter: f.liOrganizationSlugExclusionFilter || undefined,
    liOrganizationEmployeesGte: f.liOrganizationEmployeesGte || undefined,
    liOrganizationEmployeesLte: f.liOrganizationEmployeesLte || undefined,
    dateFilter: f.dateFilter || undefined,
    limit: parseInt(f.limit) || 100,
    offset: parseInt(f.offset) || 0,
    descriptionType: f.descriptionType,
  };
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Ingestion() {
  useAuth();
  const utils = trpc.useUtils();

  const [filters, setFilters] = useState<Filters>(defaultFilters());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"fetch" | "schedules" | "history">("fetch");

  // Convert-to-schedule modal state
  const [convertingHistory, setConvertingHistory] = useState<{
    id: number; name: string; filters: Filters;
  } | null>(null);
  const [convertName, setConvertName] = useState("");
  const [convertInterval, setConvertInterval] = useState<"manual" | "daily" | "weekly">("daily");
  const [convertHour, setConvertHour] = useState(9);
  const [convertMinute, setConvertMinute] = useState(0);
  const [convertDayOfWeek, setConvertDayOfWeek] = useState(1);

  // Schedule form state
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleInterval, setScheduleInterval] = useState<"manual" | "daily" | "weekly">("daily");
  const [scheduleHour, setScheduleHour] = useState(9);
  const [scheduleMinute, setScheduleMinute] = useState(0);
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(1);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  // Queries
  const { data: apiUsage, refetch: refetchUsage } = trpc.ingestion.getUsage.useQuery();
  const { data: schedules, refetch: refetchSchedules } = trpc.ingestion.listSchedules.useQuery();
  const { data: history, refetch: refetchHistory } = trpc.ingestion.listHistory.useQuery();

  // Mutations
  const fetchJobsMut = trpc.ingestion.fetchJobs.useMutation({
    onSuccess: (data) => {
      toast.success(`✓ Fetched ${data.jobsFetched} jobs — ${data.jobsIngested} ingested, ${data.jobsDuplicate} duplicates`);
      refetchUsage();
      refetchHistory();
      utils.jobs.kanban.invalidate();
    },
    onError: (e) => toast.error(`API Error: ${e.message}`),
  });

  const createScheduleMut = trpc.ingestion.createSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule created");
      setShowScheduleForm(false);
      setScheduleName("");
      setConvertingHistory(null);
      setConvertName("");
      refetchSchedules();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleScheduleMut = trpc.ingestion.toggleSchedule.useMutation({
    onSuccess: () => refetchSchedules(),
  });

  const deleteScheduleMut = trpc.ingestion.deleteSchedule.useMutation({
    onSuccess: () => { toast.success("Schedule deleted"); refetchSchedules(); },
  });

  const runNowMut = trpc.ingestion.runScheduleNow.useMutation({
    onSuccess: (data) => {
      toast.success(`✓ Ran: ${data.jobsFetched} fetched, ${data.jobsIngested} ingested`);
      refetchSchedules();
      refetchHistory();
      refetchUsage();
      utils.jobs.kanban.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const isFetching = fetchJobsMut.isPending || runNowMut.isPending;

  // Quota calculations
  const jobsRemaining = apiUsage && 'jobsRemaining' in apiUsage ? apiUsage.jobsRemaining : undefined;
  const jobsLimit = apiUsage && 'jobsLimit' in apiUsage ? apiUsage.jobsLimit : undefined;
  const requestsRemaining = apiUsage && 'requestsRemaining' in apiUsage ? apiUsage.requestsRemaining : undefined;
  const requestsLimit = apiUsage && 'requestsLimit' in apiUsage ? apiUsage.requestsLimit : undefined;
  const jobsPct = jobsLimit && jobsRemaining != null ? Math.round((jobsRemaining / jobsLimit) * 100) : null;
  const quotaWarning = jobsPct !== null && jobsPct < 20;
  const quotaCritical = jobsPct !== null && jobsPct < 5;

  const handleFetch = () => fetchJobsMut.mutate(filtersToInput(filters));

  const handleCreateSchedule = () => {
    if (!scheduleName.trim()) { toast.error("Schedule name required"); return; }
    createScheduleMut.mutate({
      name: scheduleName,
      endpoint: filters.endpoint,
      filters: filtersToInput(filters),
      intervalType: scheduleInterval,
      scheduleHour,
      scheduleMinute,
      scheduleDayOfWeek: scheduleInterval === "weekly" ? scheduleDayOfWeek : undefined,
    });
  };

  const handleConvertToSchedule = () => {
    if (!convertingHistory) return;
    if (!convertName.trim()) { toast.error("Schedule name required"); return; }
    createScheduleMut.mutate({
      name: convertName,
      endpoint: convertingHistory.filters.endpoint,
      filters: filtersToInput(convertingHistory.filters),
      intervalType: convertInterval,
      scheduleHour: convertHour,
      scheduleMinute: convertMinute,
      scheduleDayOfWeek: convertInterval === "weekly" ? convertDayOfWeek : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Zap size={20} className="text-amber-400" />
          <h1 className="text-2xl font-black tracking-widest text-amber-400 uppercase">INGEST JOBS</h1>
        </div>
        <div className="h-0.5 w-full bg-amber-400 mb-3" />
        <p className="text-xs text-gray-400">ACTIVE JOBS DB · active-jobs-db.p.rapidapi.com · 175K+ ORGS</p>
      </div>

      {/* Quota Warning Banner */}
      {apiUsage && (
        <div className={`mb-4 p-3 border-2 flex items-start gap-3 ${
          quotaCritical ? "border-red-500 bg-red-500/10" :
          quotaWarning ? "border-yellow-500 bg-yellow-500/10" :
          "border-gray-700 bg-gray-900/50"
        }`}>
          {quotaCritical ? <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" /> :
           quotaWarning ? <AlertTriangle size={16} className="text-yellow-400 mt-0.5 shrink-0" /> :
           <CheckCircle2 size={16} className="text-green-400 mt-0.5 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-4 text-xs">
              <span>
                <span className="text-gray-400">JOBS REMAINING: </span>
                <span className={quotaCritical ? "text-red-400 font-bold" : quotaWarning ? "text-yellow-400 font-bold" : "text-green-400 font-bold"}>
                  {jobsRemaining?.toLocaleString() ?? "—"}
                </span>
                {jobsLimit ? <span className="text-gray-500"> / {jobsLimit.toLocaleString()}</span> : null}
                {jobsPct !== null ? <span className="text-gray-500"> ({jobsPct}%)</span> : null}
              </span>
              <span>
                <span className="text-gray-400">REQUESTS REMAINING: </span>
                <span className="text-amber-400 font-bold">{requestsRemaining?.toLocaleString() ?? "—"}</span>
                {requestsLimit ? <span className="text-gray-500"> / {requestsLimit.toLocaleString()}</span> : null}
              </span>
              <span>
                <span className="text-gray-400">CALLS THIS MONTH: </span>
                <span className="text-white font-bold">{apiUsage.callCount}</span>
              </span>
            </div>
            {quotaCritical && <p className="text-red-400 text-xs mt-1 font-bold">⚠ CRITICAL: Less than 5% of job credits remaining!</p>}
            {quotaWarning && !quotaCritical && <p className="text-yellow-400 text-xs mt-1">Warning: Less than 20% of job credits remaining.</p>}
          </div>
          {jobsPct !== null && (
            <div className="w-24 shrink-0">
              <div className="h-2 bg-gray-800 border border-gray-600">
                <div className={`h-full transition-all ${quotaCritical ? "bg-red-500" : quotaWarning ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${jobsPct}%` }} />
              </div>
              <p className="text-xs text-gray-500 text-right mt-0.5">{jobsPct}%</p>
            </div>
          )}
        </div>
      )}

      {/* Fetch-in-progress banner */}
      {isFetching && (
        <div className="mb-4 p-3 border-2 border-amber-400 bg-amber-400/10 flex items-center gap-3 animate-pulse">
          <RefreshCw size={16} className="text-amber-400 animate-spin shrink-0" />
          <p className="text-xs font-mono text-amber-400 font-bold tracking-widest">
            FETCH IN PROGRESS — FIELDS LOCKED UNTIL COMPLETE…
          </p>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex border-b-2 border-gray-700 mb-6">
        {(["fetch", "schedules", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest transition-colors border-b-2 -mb-0.5 ${
              activeTab === tab
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab === "fetch" ? "▶ FETCH NOW" : tab === "schedules" ? "⏱ SCHEDULES" : "📋 HISTORY"}
          </button>
        ))}
      </div>

      {/* ── FETCH TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "fetch" && (
        <div className={`space-y-6 transition-opacity ${isFetching ? "opacity-50 pointer-events-none" : ""}`}>
          {/* Endpoint + Limit + Offset */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectInput
              label="ENDPOINT"
              value={filters.endpoint}
              onChange={(v) => setFilter("endpoint", v as "active-ats-7d" | "active-ats-24h")}
              options={[
                { value: "active-ats-7d", label: "active-ats-7d (Last 7 days)" },
                { value: "active-ats-24h", label: "active-ats-24h (Last 24 hours)" },
              ]}
              disabled={isFetching}
            />
            <SelectInput
              label="LIMIT (10–100 per call)"
              value={filters.limit}
              onChange={(v) => setFilter("limit", v)}
              options={[10, 25, 50, 75, 100].map((n) => ({ value: String(n), label: `${n} jobs` }))}
              disabled={isFetching}
            />
            <div>
              <label className="block text-xs font-mono text-amber-400 mb-1">OFFSET (pagination)</label>
              <input
                type="number"
                min={0}
                step={parseInt(filters.limit) || 100}
                value={filters.offset}
                onChange={(e) => setFilter("offset", e.target.value)}
                disabled={isFetching}
                className="w-full px-3 py-2 text-xs font-mono bg-black border-2 border-gray-700 focus:border-amber-400 outline-none text-white disabled:opacity-40"
              />
            </div>
          </div>

          {/* Core Filters */}
          <div className="border-2 border-gray-800 p-4 space-y-4">
            <p className="text-xs font-mono text-amber-400 font-bold tracking-widest">▌ CORE FILTERS</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="TITLE FILTER"
                value={filters.titleFilter}
                onChange={(v) => setFilter("titleFilter", v)}
                placeholder='e.g. "Software Engineer" OR Developer'
                disabled={isFetching}
              />
              <AutocompleteInput
                label="LOCATION FILTER"
                value={filters.locationFilter}
                onChange={(v) => setFilter("locationFilter", v)}
                suggestions={LOCATION_SUGGESTIONS}
                placeholder='e.g. "United States" OR "United Kingdom"'
                disabled={isFetching}
              />
              <TextInput
                label="DESCRIPTION FILTER"
                value={filters.descriptionFilter}
                onChange={(v) => setFilter("descriptionFilter", v)}
                placeholder="Keywords in job description"
                disabled={isFetching}
              />
              <div>
                <label className="block text-xs font-mono text-amber-400 mb-1">DATE FILTER</label>
                <input
                  type="date"
                  value={filters.dateFilter}
                  onChange={(e) => setFilter("dateFilter", e.target.value)}
                  disabled={isFetching}
                  className="w-full px-3 py-2 text-xs font-mono bg-black border-2 border-gray-700 focus:border-amber-400 outline-none text-white disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          {/* ATS Source */}
          <div className="border-2 border-gray-800 p-4 space-y-4">
            <p className="text-xs font-mono text-amber-400 font-bold tracking-widest">▌ ATS SOURCE</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MultiSelect
                label="SOURCE (include)"
                options={ATS_SOURCES}
                selected={filters.source}
                onChange={(v) => setFilter("source", v)}
                placeholder="All ATS sources"
                disabled={isFetching}
              />
              <MultiSelect
                label="SOURCE EXCLUSION"
                options={ATS_SOURCES}
                selected={filters.sourceExclusion}
                onChange={(v) => setFilter("sourceExclusion", v)}
                placeholder="None excluded"
                disabled={isFetching}
              />
            </div>
          </div>

          {/* AI Filters */}
          <div className="border-2 border-gray-800 p-4 space-y-4">
            <p className="text-xs font-mono text-amber-400 font-bold tracking-widest">▌ AI FILTERS</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MultiSelect
                label="WORK ARRANGEMENT"
                options={WORK_ARRANGEMENTS}
                selected={filters.aiWorkArrangementFilter}
                onChange={(v) => setFilter("aiWorkArrangementFilter", v)}
                placeholder="Any arrangement"
                disabled={isFetching}
              />
              <MultiSelect
                label="EXPERIENCE LEVEL (years)"
                options={EXPERIENCE_LEVELS}
                selected={filters.aiExperienceLevelFilter}
                onChange={(v) => setFilter("aiExperienceLevelFilter", v)}
                placeholder="Any level"
                disabled={isFetching}
              />
              <MultiSelect
                label="EMPLOYMENT TYPE"
                options={EMPLOYMENT_TYPES}
                selected={filters.aiEmploymentTypeFilter}
                onChange={(v) => setFilter("aiEmploymentTypeFilter", v)}
                placeholder="Any type"
                disabled={isFetching}
              />
              <MultiSelect
                label="TAXONOMY (include)"
                options={TAXONOMIES}
                selected={filters.aiTaxonomiesAFilter}
                onChange={(v) => setFilter("aiTaxonomiesAFilter", v)}
                placeholder="Any taxonomy"
                disabled={isFetching}
              />
              <MultiSelect
                label="TAXONOMY EXCLUSION"
                options={TAXONOMIES}
                selected={filters.aiTaxonomiesAExclusionFilter}
                onChange={(v) => setFilter("aiTaxonomiesAExclusionFilter", v)}
                placeholder="None excluded"
                disabled={isFetching}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <TriToggle label="REMOTE" value={filters.remote} onChange={(v) => setFilter("remote", v)} disabled={isFetching} />
              <TriToggle label="AGENCY" value={filters.agency} onChange={(v) => setFilter("agency", v)} disabled={isFetching} />
              <TriToggle label="VISA SPONSORSHIP" value={filters.aiVisaSponsorshipFilter} onChange={(v) => setFilter("aiVisaSponsorshipFilter", v)} disabled={isFetching} />
              <TriToggle label="HAS SALARY" value={filters.aiHasSalary} onChange={(v) => setFilter("aiHasSalary", v)} disabled={isFetching} />
              <TriToggle label="INCLUDE LINKEDIN" value={filters.includeLi} onChange={(v) => setFilter("includeLi", v)} disabled={isFetching} />
            </div>
          </div>

          {/* Advanced Filters (collapsible) */}
          <div className="border-2 border-gray-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 text-xs font-mono text-gray-400 hover:text-amber-400 flex items-center justify-between transition-colors"
            >
              <span className="font-bold tracking-widest">▌ ADVANCED FILTERS (ORG / LINKEDIN)</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showAdvanced && (
              <div className="px-4 pb-4 space-y-4 border-t-2 border-gray-800 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextInput label="ORGANIZATION FILTER (exact, comma-separated)" value={filters.organizationFilter} onChange={(v) => setFilter("organizationFilter", v)} placeholder="e.g. NVIDIA,Walmart" disabled={isFetching} />
                  <TextInput label="ORGANIZATION EXCLUSION" value={filters.organizationExclusionFilter} onChange={(v) => setFilter("organizationExclusionFilter", v)} placeholder="e.g. Staffing Inc" disabled={isFetching} />
                  <TextInput label="ADVANCED TITLE FILTER" value={filters.advancedTitleFilter} onChange={(v) => setFilter("advancedTitleFilter", v)} placeholder="e.g. (AI | 'Machine Learning') & ! Junior" disabled={isFetching} />
                  <TextInput label="LI INDUSTRY FILTER" value={filters.liIndustryFilter} onChange={(v) => setFilter("liIndustryFilter", v)} placeholder="e.g. Software Development" disabled={isFetching} />
                  <TextInput label="LI ORG SLUG FILTER" value={filters.liOrganizationSlugFilter} onChange={(v) => setFilter("liOrganizationSlugFilter", v)} placeholder="e.g. netflix,walmart" disabled={isFetching} />
                  <TextInput label="LI ORG SLUG EXCLUSION" value={filters.liOrganizationSlugExclusionFilter} onChange={(v) => setFilter("liOrganizationSlugExclusionFilter", v)} placeholder="Slugs to exclude" disabled={isFetching} />
                  <div className="grid grid-cols-2 gap-2">
                    <TextInput label="EMPLOYEES ≥" value={filters.liOrganizationEmployeesGte} onChange={(v) => setFilter("liOrganizationEmployeesGte", v)} placeholder="e.g. 50" disabled={isFetching} />
                    <TextInput label="EMPLOYEES ≤" value={filters.liOrganizationEmployeesLte} onChange={(v) => setFilter("liOrganizationEmployeesLte", v)} placeholder="e.g. 5000" disabled={isFetching} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleFetch}
              disabled={isFetching}
              className="bg-amber-400 text-black hover:bg-amber-300 font-mono font-bold text-xs tracking-widest px-6 py-2 border-0"
            >
              {isFetching ? (
                <><RefreshCw size={14} className="animate-spin mr-2" />FETCHING…</>
              ) : (
                <><Play size={14} className="mr-2" />FETCH NOW</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowScheduleForm(true); setActiveTab("schedules"); }}
              disabled={isFetching}
              className="border-2 border-amber-400 text-amber-400 hover:bg-amber-400/10 font-mono text-xs tracking-widest"
            >
              <Calendar size={14} className="mr-2" />SAVE AS SCHEDULE
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilters(defaultFilters())}
              disabled={isFetching}
              className="border-2 border-gray-600 text-gray-400 hover:border-gray-400 font-mono text-xs tracking-widest"
            >
              RESET FILTERS
            </Button>
          </div>
        </div>
      )}

      {/* ── SCHEDULES TAB ──────────────────────────────────────────────────── */}
      {activeTab === "schedules" && (
        <div className="space-y-6">
          <div className="border-2 border-amber-400/50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-amber-400 font-bold tracking-widest">▌ CREATE SCHEDULE</p>
              <button
                type="button"
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="text-xs text-gray-500 hover:text-amber-400 transition-colors"
              >
                {showScheduleForm ? "▲ COLLAPSE" : "▼ EXPAND"}
              </button>
            </div>
            {showScheduleForm && (
              <div className="space-y-4">
                <TextInput label="SCHEDULE NAME" value={scheduleName} onChange={setScheduleName} placeholder="e.g. Daily Remote React Jobs" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SelectInput
                    label="INTERVAL"
                    value={scheduleInterval}
                    onChange={(v) => setScheduleInterval(v as "manual" | "daily" | "weekly")}
                    options={[
                      { value: "manual", label: "Manual only" },
                      { value: "daily", label: "Daily" },
                      { value: "weekly", label: "Weekly" },
                    ]}
                  />
                  {scheduleInterval !== "manual" && (
                    <>
                      {scheduleInterval === "weekly" && (
                        <SelectInput
                          label="DAY OF WEEK"
                          value={String(scheduleDayOfWeek)}
                          onChange={(v) => setScheduleDayOfWeek(parseInt(v))}
                          options={DAYS_OF_WEEK.map((d, i) => ({ value: String(i), label: d }))}
                        />
                      )}
                      <div>
                        <label className="block text-xs font-mono text-amber-400 mb-1">TIME (UTC)</label>
                        <div className="flex gap-2">
                          <select value={scheduleHour} onChange={(e) => setScheduleHour(parseInt(e.target.value))} className="flex-1 px-2 py-2 text-xs font-mono bg-black border-2 border-gray-700 focus:border-amber-400 outline-none text-white">
                            {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}h</option>)}
                          </select>
                          <select value={scheduleMinute} onChange={(e) => setScheduleMinute(parseInt(e.target.value))} className="flex-1 px-2 py-2 text-xs font-mono bg-black border-2 border-gray-700 focus:border-amber-400 outline-none text-white">
                            {[0, 15, 30, 45].map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}m</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500">Uses the current filter configuration from the Fetch Now tab.</p>
                <Button onClick={handleCreateSchedule} disabled={createScheduleMut.isPending} className="bg-amber-400 text-black hover:bg-amber-300 font-mono font-bold text-xs tracking-widest">
                  <Plus size={14} className="mr-2" />{createScheduleMut.isPending ? "SAVING…" : "SAVE SCHEDULE"}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {!schedules?.length && (
              <div className="border-2 border-dashed border-gray-700 p-8 text-center">
                <Calendar size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-xs font-mono text-gray-500">NO SCHEDULES YET</p>
                <p className="text-xs text-gray-600 mt-1">Create a schedule to auto-fetch jobs daily or weekly</p>
              </div>
            )}
            {schedules?.map((s) => (
              <div key={s.id} className={`border-2 p-4 ${s.enabled ? "border-amber-400/40" : "border-gray-700"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{s.name}</span>
                      <Badge className={`text-xs font-mono ${s.enabled ? "bg-green-500/20 text-green-400 border-green-500" : "bg-gray-700 text-gray-400 border-gray-600"}`}>
                        {s.enabled ? "ACTIVE" : "PAUSED"}
                      </Badge>
                      <Badge className="text-xs font-mono bg-amber-400/10 text-amber-400 border-amber-400/50">{s.endpoint}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      <span>
                        <Clock size={10} className="inline mr-1" />
                        {s.intervalType === "manual" ? "Manual only" :
                         s.intervalType === "daily" ? `Daily at ${String(s.scheduleHour ?? 9).padStart(2,"0")}:${String(s.scheduleMinute ?? 0).padStart(2,"0")} UTC` :
                         `Weekly ${DAYS_OF_WEEK[s.scheduleDayOfWeek ?? 1]} at ${String(s.scheduleHour ?? 9).padStart(2,"0")}:${String(s.scheduleMinute ?? 0).padStart(2,"0")} UTC`}
                      </span>
                      {s.lastRunAt && <span>Last run: {new Date(s.lastRunAt).toLocaleString()}</span>}
                      {s.nextRunAt && s.enabled && <span className="text-amber-400">Next: {new Date(s.nextRunAt).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => runNowMut.mutate({ id: s.id })} disabled={runNowMut.isPending} title="Run now" className="p-1.5 border border-amber-400 text-amber-400 hover:bg-amber-400/10 transition-colors">
                      <Play size={12} />
                    </button>
                    <button onClick={() => toggleScheduleMut.mutate({ id: s.id, enabled: !s.enabled })} title={s.enabled ? "Pause" : "Resume"} className={`p-1.5 border transition-colors ${s.enabled ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10" : "border-green-500 text-green-500 hover:bg-green-500/10"}`}>
                      {s.enabled ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
                    </button>
                    <button onClick={() => deleteScheduleMut.mutate({ id: s.id })} title="Delete" className="p-1.5 border border-red-500 text-red-500 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {!history?.length && (
            <div className="border-2 border-dashed border-gray-700 p-8 text-center">
              <Clock size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-xs font-mono text-gray-500">NO FETCH HISTORY YET</p>
              <p className="text-xs text-gray-600 mt-1">Run a fetch to see results here</p>
            </div>
          )}
          {history?.map((h) => (
            <div key={h.id} className={`border-2 p-4 ${h.status === "success" ? "border-green-500/30" : "border-red-500/30"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-bold ${h.status === "success" ? "text-green-400" : "text-red-400"}`}>
                      {h.status === "success" ? "✓" : "✗"} {h.scheduleName ?? "AD-HOC FETCH"}
                    </span>
                    <Badge className="text-xs font-mono bg-gray-800 text-gray-400 border-gray-600">{h.endpoint}</Badge>
                    {/* Show "AD-HOC" badge for manual fetches */}
                    {!h.scheduleId && (
                      <Badge className="text-xs font-mono bg-cyan-400/10 text-cyan-400 border-cyan-400/50">AD-HOC</Badge>
                    )}
                  </div>
                  {h.status === "success" ? (
                    <div className="flex flex-wrap gap-4 text-xs">
                      <span className="text-white font-bold">{h.jobsFetched} fetched</span>
                      <span className="text-green-400">{h.jobsIngested} ingested</span>
                      <span className="text-yellow-400">{h.jobsDuplicate} duplicates</span>
                      {h.jobsRemaining !== null && h.jobsRemaining !== undefined && (
                        <span className="text-gray-400">{h.jobsRemaining.toLocaleString()} credits left</span>
                      )}
                      {/* Duration */}
                      {'durationMs' in h && h.durationMs != null && (
                        <span className="text-purple-400 flex items-center gap-1">
                          <Timer size={10} />
                          {formatDuration(h.durationMs as number)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-red-400">{h.errorMessage}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-gray-500">{new Date(h.ranAt).toLocaleString()}</span>
                  {/* Convert to Schedule button — only for ad-hoc fetches */}
                  {!h.scheduleId && h.status === "success" && (
                    <button
                      onClick={() => {
                        // Reconstruct filters from the history snapshot
                        const snap = (h.filters ?? {}) as Record<string, unknown>;
                        const reconstructed: Filters = {
                          ...defaultFilters(),
                          endpoint: (snap.endpoint as Filters["endpoint"]) ?? "active-ats-7d",
                          titleFilter: (snap.titleFilter as string) ?? "",
                          locationFilter: (snap.locationFilter as string) ?? "",
                          descriptionFilter: (snap.descriptionFilter as string) ?? "",
                          organizationFilter: (snap.organizationFilter as string) ?? "",
                          limit: String(snap.limit ?? 100),
                          offset: String(snap.offset ?? 0),
                        };
                        setConvertingHistory({ id: h.id, name: `Schedule from ${new Date(h.ranAt).toLocaleDateString()}`, filters: reconstructed });
                        setConvertName(`Schedule from ${new Date(h.ranAt).toLocaleDateString()}`);
                      }}
                      className="text-xs font-mono text-amber-400 border border-amber-400/50 hover:bg-amber-400/10 px-2 py-1 transition-colors flex items-center gap-1"
                    >
                      <Calendar size={10} />
                      CONVERT TO SCHEDULE
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Convert-to-Schedule Modal ─────────────────────────────────────── */}
      {convertingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-black border-2 border-amber-400 p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono font-bold text-amber-400 tracking-widest">▌ CONVERT TO SCHEDULE</h3>
              <button onClick={() => setConvertingHistory(null)} className="text-gray-500 hover:text-white transition-colors text-lg leading-none">×</button>
            </div>
            <p className="text-xs text-gray-400">Create a recurring schedule using the same filters as this ad-hoc fetch.</p>
            <TextInput label="SCHEDULE NAME" value={convertName} onChange={setConvertName} placeholder="e.g. Daily Remote Jobs" />
            <SelectInput
              label="INTERVAL"
              value={convertInterval}
              onChange={(v) => setConvertInterval(v as "manual" | "daily" | "weekly")}
              options={[
                { value: "manual", label: "Manual only" },
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
              ]}
            />
            {convertInterval !== "manual" && (
              <div className="grid grid-cols-2 gap-3">
                {convertInterval === "weekly" && (
                  <SelectInput
                    label="DAY OF WEEK"
                    value={String(convertDayOfWeek)}
                    onChange={(v) => setConvertDayOfWeek(parseInt(v))}
                    options={DAYS_OF_WEEK.map((d, i) => ({ value: String(i), label: d }))}
                  />
                )}
                <div>
                  <label className="block text-xs font-mono text-amber-400 mb-1">TIME (UTC)</label>
                  <div className="flex gap-2">
                    <select value={convertHour} onChange={(e) => setConvertHour(parseInt(e.target.value))} className="flex-1 px-2 py-2 text-xs font-mono bg-black border-2 border-gray-700 focus:border-amber-400 outline-none text-white">
                      {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}h</option>)}
                    </select>
                    <select value={convertMinute} onChange={(e) => setConvertMinute(parseInt(e.target.value))} className="flex-1 px-2 py-2 text-xs font-mono bg-black border-2 border-gray-700 focus:border-amber-400 outline-none text-white">
                      {[0, 15, 30, 45].map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}m</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleConvertToSchedule}
                disabled={createScheduleMut.isPending}
                className="flex-1 bg-amber-400 text-black hover:bg-amber-300 font-mono font-bold text-xs tracking-widest"
              >
                <Calendar size={14} className="mr-2" />
                {createScheduleMut.isPending ? "SAVING…" : "CREATE SCHEDULE"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConvertingHistory(null)}
                className="border-2 border-gray-600 text-gray-400 hover:border-gray-400 font-mono text-xs"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
