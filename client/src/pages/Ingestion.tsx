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
  Copy,
  Play,
  Plus,
  RefreshCw,
  Terminal,
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

// Location options for multi-select
const LOCATION_OPTIONS = [
  "United Arab Emirates","United States","United Kingdom","Canada","Australia",
  "Germany","France","Netherlands","Singapore","India","Ireland","New Zealand",
  "Switzerland","Sweden","Norway","Denmark","Remote",
  "Dubai","Abu Dhabi","New York","San Francisco","London","Toronto","Sydney",
  "Berlin","Amsterdam","Austin","Seattle","Chicago","Boston","Los Angeles","Atlanta","Miami",
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

type AllEndpoints = "active-ats-7d" | "active-ats-24h" | "active-jb-7d" | "active-jb-24h";
const isLinkedInEndpoint = (ep: string) => ep === "active-jb-7d" || ep === "active-jb-24h";

const defaultFilters = () => ({
  endpoint: "active-ats-7d" as AllEndpoints,
  titleFilter: "",
  advancedTitleFilter: "",
  locationFilter: [] as string[],
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
  // LinkedIn-specific filters
  linkedinSeniority: "",
  linkedinDirectApply: undefined as TriState,
  linkedinOrgSlugFilter: "",
});

type Filters = ReturnType<typeof defaultFilters>;

function filtersToInput(f: Filters) {
  return {
    endpoint: f.endpoint,
    titleFilter: f.titleFilter || undefined,
    advancedTitleFilter: f.advancedTitleFilter || undefined,
    locationFilter: f.locationFilter.length ? f.locationFilter.join(" OR ") : undefined,
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
    linkedinSeniority: f.linkedinSeniority || undefined,
    linkedinDirectApply: f.linkedinDirectApply,
    linkedinOrgSlugFilter: f.linkedinOrgSlugFilter || undefined,
  };
}

// ── Fetch Details Component ─────────────────────────────────────────────────

function FetchDetails({ filters }: { filters?: unknown }) {
  if (!filters) return null;
  const f = filters as Record<string, unknown>;
  const details: { label: string; value: string }[] = [];
  if (f.advancedTitleFilter) details.push({ label: "TITLE", value: String(f.advancedTitleFilter) });
  else if (f.titleFilter) details.push({ label: "TITLE", value: String(f.titleFilter) });
  if (f.advancedDescriptionFilter) details.push({ label: "DESC", value: String(f.advancedDescriptionFilter) });
  if (f.locationFilter) details.push({ label: "LOCATION", value: String(f.locationFilter) });
  if (f.descriptionFilter) details.push({ label: "DESCRIPTION", value: String(f.descriptionFilter) });
  if (f.organizationFilter) details.push({ label: "ORG", value: String(f.organizationFilter) });
  if (f.source) details.push({ label: "SOURCE", value: String(f.source) });
  if (f.aiWorkArrangementFilter) details.push({ label: "ARRANGEMENT", value: String(f.aiWorkArrangementFilter) });
  if (f.aiExperienceLevelFilter) details.push({ label: "EXPERIENCE", value: String(f.aiExperienceLevelFilter) });
  if (f.aiEmploymentTypeFilter) details.push({ label: "EMPLOYMENT", value: String(f.aiEmploymentTypeFilter) });
  if (f.aiTaxonomiesAFilter) details.push({ label: "TAXONOMY", value: String(f.aiTaxonomiesAFilter) });
  if (f.remote !== undefined && f.remote !== null) details.push({ label: "REMOTE", value: f.remote === true ? "YES" : f.remote === false ? "NO" : "ANY" });
  if (f.limit) details.push({ label: "LIMIT", value: String(f.limit) });
  if (f.offset && f.offset !== 0) details.push({ label: "OFFSET", value: String(f.offset) });
  if (details.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {details.map((d) => (
        <span key={d.label} className="text-xs font-mono">
          <span className="text-gray-500">{d.label}: </span>
          <span className="text-cyan-400 truncate max-w-[200px] inline-block align-bottom" title={d.value}>{d.value}</span>
        </span>
      ))}
    </div>
  );
}

// ── History Row Component ───────────────────────────────────────────────────

type HistoryEntry = {
  id: number;
  scheduleId?: number | null;
  scheduleName?: string | null;
  endpoint: string;
  filters?: unknown;
  jobsFetched: number;
  jobsIngested: number;
  jobsDuplicate: number;
  jobsRemaining?: number | null;
  requestsRemaining?: number | null;
  status: "success" | "error" | "partial";
  errorMessage?: string | null;
  errorDetail?: string | null;
  durationMs?: number | null;
  ranAt: Date;
};

function HistoryRow({
  h,
  onConvert,
}: {
  h: HistoryEntry;
  onConvert: (h: HistoryEntry) => void;
}) {
  const [expandedError, setExpandedError] = useState(false);

  let parsedDetail: { httpStatus?: number; contentType?: string; errorType?: string; rawSnippet?: string; url?: string; timestamp?: string } | null = null;
  if (h.errorDetail) {
    try { parsedDetail = JSON.parse(h.errorDetail); } catch { /* ignore */ }
  }

  return (
    <div className={`border-2 p-4 ${h.status === "success" ? "border-green-500/30" : "border-red-500/40 bg-red-950/10"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {h.status === "success" ? (
              <CheckCircle2 size={12} className="text-green-400 shrink-0" />
            ) : (
              <XCircle size={12} className="text-red-400 shrink-0" />
            )}
            <span className={`text-xs font-bold ${h.status === "success" ? "text-green-400" : "text-red-400"}`}>
              {h.scheduleName ?? "AD-HOC FETCH"}
            </span>
            <Badge className="text-xs font-mono bg-gray-800 text-gray-400 border-gray-600">{h.endpoint}</Badge>
            {/* API source badge */}
            {h.endpoint === "wellfound" ? (
              <Badge className="text-xs font-mono bg-emerald-400/10 text-emerald-400 border-emerald-400/40">WELLFOUND</Badge>
            ) : ["active-jb-7d", "active-jb-24h"].includes(h.endpoint) ? (
              <Badge className="text-xs font-mono border" style={{ background: "rgba(10,102,194,0.15)", color: "#4d9de0", borderColor: "rgba(10,102,194,0.5)" }}>LINKEDIN</Badge>
            ) : (
              <Badge className="text-xs font-mono bg-amber-400/10 text-amber-400 border-amber-400/40">EXTERNAL</Badge>
            )}
            {!h.scheduleId && (
              <Badge className="text-xs font-mono bg-cyan-400/10 text-cyan-400 border-cyan-400/50">AD-HOC</Badge>
            )}
            {h.status === "error" && parsedDetail?.httpStatus && (
              <Badge className="text-xs font-mono bg-red-500/20 text-red-400 border-red-500/50">HTTP {parsedDetail.httpStatus}</Badge>
            )}
            {h.status === "error" && parsedDetail?.errorType && (
              <Badge className="text-xs font-mono bg-orange-500/20 text-orange-400 border-orange-500/50">
                {parsedDetail.errorType.replace(/_/g, " ").toUpperCase()}
              </Badge>
            )}
          </div>
          {h.status === "success" ? (
            <div>
              <div className="flex flex-wrap gap-4 text-xs">
                <span className="text-white font-bold">{h.jobsFetched} fetched</span>
                <span className="text-green-400">{h.jobsIngested} ingested</span>
                <span className="text-yellow-400">{h.jobsDuplicate} duplicates</span>
                {h.jobsRemaining !== null && h.jobsRemaining !== undefined && (
                  <span className="text-gray-400">{h.jobsRemaining.toLocaleString()} credits left</span>
                )}
                {h.durationMs != null && (
                  <span className="text-purple-400 flex items-center gap-1">
                    <Timer size={10} />
                    {formatDuration(h.durationMs)}
                  </span>
                )}
              </div>
              <FetchDetails filters={h.filters} />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-red-300 font-medium">{h.errorMessage}</p>
              {h.durationMs != null && (
                <span className="text-purple-400 text-xs flex items-center gap-1">
                  <Timer size={10} />
                  {formatDuration(h.durationMs)}
                </span>
              )}
              {parsedDetail && (
                <div>
                  <button
                    onClick={() => setExpandedError(!expandedError)}
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors mt-1"
                  >
                    <Terminal size={10} />
                    {expandedError ? "HIDE" : "SHOW"} TECHNICAL DETAILS
                    {expandedError ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>
                  {expandedError && (
                    <div className="mt-2 border border-red-500/30 bg-black/60 p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {parsedDetail.httpStatus && (
                          <><span className="text-gray-500">HTTP Status:</span><span className="text-red-400 font-mono">{parsedDetail.httpStatus}</span></>
                        )}
                        {parsedDetail.errorType && (
                          <><span className="text-gray-500">Error Type:</span><span className="text-orange-400 font-mono">{parsedDetail.errorType}</span></>
                        )}
                        {parsedDetail.contentType && (
                          <><span className="text-gray-500">Content-Type:</span><span className="text-yellow-400 font-mono">{parsedDetail.contentType}</span></>
                        )}
                        {parsedDetail.timestamp && (
                          <><span className="text-gray-500">Timestamp:</span><span className="text-gray-400 font-mono">{new Date(parsedDetail.timestamp).toLocaleString()}</span></>
                        )}
                      </div>
                      {parsedDetail.url && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Request URL:</p>
                          <p className="text-xs font-mono text-cyan-400 break-all bg-gray-900 p-2">{parsedDetail.url}</p>
                        </div>
                      )}
                      {parsedDetail.rawSnippet && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500">Raw Response (first 500 chars):</p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(parsedDetail, null, 2));
                                toast.success("Error details copied to clipboard");
                              }}
                              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                            >
                              <Copy size={10} />
                              COPY
                            </button>
                          </div>
                          <pre className="text-xs font-mono text-red-300/80 bg-gray-900 p-2 overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap break-all">{parsedDetail.rawSnippet}</pre>
                        </div>
                      )}
                      <div className="border-t border-gray-700 pt-2">
                        <p className="text-xs text-gray-500 mb-1">▶ SUGGESTED FIX:</p>
                        {parsedDetail.errorType === "not_subscribed" && (
                          <p className="text-xs text-amber-400">Visit <span className="underline">rapidapi.com</span> → search "Active Jobs DB" → click Subscribe on the Basic (free) or Pro plan.</p>
                        )}
                        {parsedDetail.errorType === "quota_exceeded" && (
                          <p className="text-xs text-amber-400">Your monthly quota is exhausted. Upgrade your RapidAPI plan or wait for the monthly reset.</p>
                        )}
                        {parsedDetail.errorType === "invalid_api_key" && (
                          <p className="text-xs text-amber-400">Check your RAPIDAPI_KEY in the Secrets panel — it may be expired or incorrect.</p>
                        )}
                        {(parsedDetail.errorType === "html_response" || parsedDetail.errorType === "non_json_response") && (
                          <p className="text-xs text-amber-400">The API returned a non-JSON page. This usually means a network/proxy issue or the endpoint URL is incorrect. Try again in a few minutes.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs text-gray-500">{new Date(h.ranAt).toLocaleString()}</span>
          {!h.scheduleId && h.status === "success" && (
            <button
              onClick={() => onConvert(h)}
              className="text-xs font-mono text-amber-400 border border-amber-400/50 hover:bg-amber-400/10 px-2 py-1 transition-colors flex items-center gap-1"
            >
              <Calendar size={10} />
              CONVERT TO SCHEDULE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Ingestion() {
  useAuth();
  const utils = trpc.useUtils();

  const [filters, setFilters] = useState<Filters>(defaultFilters());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"fetch" | "schedules" | "history">("fetch");
  const [showWellFound, setShowWellFound] = useState(false);

  // WellFound scraper state
  const [wellFoundJobTitle, setWellFoundJobTitle] = useState("product-manager");
  const [wellFoundJobLocation, setWellFoundJobLocation] = useState("united-arab-emirates");
  const [wellFoundKeyword, setWellFoundKeyword] = useState("");
  const [wellFoundFullyRemote, setWellFoundFullyRemote] = useState(false);

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

  const scrapeWellFoundMut = trpc.jobs.scrapeWellFound.useMutation({
    onSuccess: (data) => {
      toast.success(`✓ WellFound: ${data.inserted} jobs ingested, ${data.duplicates} duplicates`);
      refetchHistory();
      utils.jobs.kanban.invalidate();
    },
    onError: (e) => toast.error(`WellFound Error: ${e.message}`),
  });

  const isFetching = fetchJobsMut.isPending || runNowMut.isPending || scrapeWellFoundMut.isPending;

  // Quota calculations — pick the active API's quota
  const isLI = isLinkedInEndpoint(filters.endpoint);
  const activeUsage = apiUsage ? (isLI ? apiUsage.linkedin : apiUsage.fantastic) : undefined;
  const jobsRemaining = activeUsage?.jobsRemaining ?? undefined;
  const jobsLimit = activeUsage?.jobsLimit ?? undefined;
  const requestsRemaining = activeUsage?.requestsRemaining ?? undefined;
  const requestsLimit = activeUsage?.requestsLimit ?? undefined;
  const callCount = activeUsage?.callCount ?? 0;
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
        <p className="text-xs text-gray-400">
          {isLinkedInEndpoint(filters.endpoint)
            ? "LINKEDIN JOBS API · linkedin-job-search-api.p.rapidapi.com · DIRECT LINKEDIN LISTINGS"
            : "ACTIVE JOBS DB · active-jobs-db.p.rapidapi.com · 175K+ ORGS"}
        </p>
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
                <span className="text-white font-bold">{callCount}</span>
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
            <div className="md:col-span-1">
              <label className="block text-xs font-mono text-amber-400 mb-1">API SOURCE</label>
              <div className="grid grid-cols-3 gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => setFilter("endpoint", "active-ats-7d" as AllEndpoints)}
                  disabled={isFetching}
                  className={`px-2 py-1.5 text-xs font-mono font-bold border-2 transition-colors ${
                    !isLinkedInEndpoint(filters.endpoint)
                      ? "border-amber-400 text-amber-400 bg-amber-400/10"
                      : "border-gray-700 text-gray-500 hover:border-gray-500"
                  }`}
                >
                  FANTASTIC JOBS
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("endpoint", "active-jb-7d" as AllEndpoints)}
                  disabled={isFetching}
                  className={`px-2 py-1.5 text-xs font-mono font-bold border-2 transition-colors ${
                    isLinkedInEndpoint(filters.endpoint)
                      ? "border-blue-400 text-blue-400 bg-blue-400/10"
                      : "border-gray-700 text-gray-500 hover:border-gray-500"
                  }`}
                >
                  LINKEDIN JOBS
                </button>
                <button
                  type="button"
                  onClick={() => setShowWellFound(true)}
                  disabled={isFetching}
                  className={`px-2 py-1.5 text-xs font-mono font-bold border-2 transition-colors ${
                    showWellFound
                      ? "border-emerald-400 text-emerald-400 bg-emerald-400/10"
                      : "border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
                  } disabled:opacity-50`}
                >
                  WELLFOUND
                </button>
              </div>
            </div>

          </div>

          {/* WellFound Scraper View — shown when WellFound button is pressed */}
          {showWellFound && (
            <div className="border-2 border-emerald-500/50 p-4 space-y-4 bg-emerald-950/10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-emerald-400 font-bold tracking-widest">▌ WELLFOUND SCRAPER</p>
                <button
                  type="button"
                  onClick={() => setShowWellFound(false)}
                  className="text-xs font-mono text-gray-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                >
                  ← BACK TO API SOURCES
                </button>
              </div>
              <p className="text-xs text-gray-400">Scrape job listings directly from WellFound (AngelList). Configure your search below and activate the scraper.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="JOB TITLE"
                  value={wellFoundJobTitle}
                  onChange={setWellFoundJobTitle}
                  placeholder="e.g. product-manager"
                  disabled={isFetching}
                />
                <TextInput
                  label="LOCATION"
                  value={wellFoundJobLocation}
                  onChange={setWellFoundJobLocation}
                  placeholder="e.g. united-arab-emirates"
                  disabled={isFetching}
                />
              </div>
              <TextInput
                label="KEYWORD (optional)"
                value={wellFoundKeyword}
                onChange={setWellFoundKeyword}
                placeholder="e.g. fintech, AI"
                disabled={isFetching}
              />
              <label className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <input
                  type="checkbox"
                  checked={wellFoundFullyRemote}
                  onChange={(e) => setWellFoundFullyRemote(e.target.checked)}
                  disabled={isFetching}
                  className="w-4 h-4 accent-emerald-400"
                />
                FULLY REMOTE ONLY
              </label>
              <div className="pt-2 border-t border-emerald-800">
                <Button
                  onClick={() => {
                    if (!wellFoundJobTitle.trim() || !wellFoundJobLocation.trim()) {
                      toast.error("Job title and location required");
                      return;
                    }
                    scrapeWellFoundMut.mutate({
                      jobTitle: wellFoundJobTitle,
                      jobLocation: wellFoundJobLocation,
                      keyword: wellFoundKeyword || undefined,
                      fullyRemote: wellFoundFullyRemote,
                    });
                  }}
                  disabled={isFetching || scrapeWellFoundMut.isPending}
                  className="bg-emerald-500 text-black hover:bg-emerald-400 font-mono font-bold text-xs tracking-widest px-6 py-2 border-0 w-full"
                >
                  {scrapeWellFoundMut.isPending ? (
                    <><RefreshCw size={14} className="animate-spin mr-2" />SCRAPING WELLFOUND…</>
                  ) : (
                    <><Zap size={14} className="mr-2" />ACTIVATE WELLFOUND SCRAPER</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Normal API filters — hidden when WellFound view is active */}
          {!showWellFound && (
            <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <MultiSelect
                label="LOCATION FILTER"
                options={LOCATION_OPTIONS}
                selected={filters.locationFilter}
                onChange={(v) => setFilter("locationFilter", v)}
                placeholder='Any location'
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
              {!isLinkedInEndpoint(filters.endpoint) && (
                <TriToggle label="INCLUDE LINKEDIN" value={filters.includeLi} onChange={(v) => setFilter("includeLi", v)} disabled={isFetching} />
              )}
            </div>
          </div>

          {/* LinkedIn-specific filters (shown only when LinkedIn endpoint selected) */}
          {isLinkedInEndpoint(filters.endpoint) && (
            <div className="border-2 border-blue-900 p-4 space-y-4">
              <p className="text-xs font-mono text-blue-400 font-bold tracking-widest">▌ LINKEDIN-SPECIFIC FILTERS</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectInput
                  label="SENIORITY"
                  value={filters.linkedinSeniority}
                  onChange={(v) => setFilter("linkedinSeniority", v)}
                  placeholder="Any seniority"
                  options={[
                    { value: "Internship", label: "Internship" },
                    { value: "Entry level", label: "Entry level" },
                    { value: "Associate", label: "Associate" },
                    { value: "Mid-Senior level", label: "Mid-Senior level" },
                    { value: "Director", label: "Director" },
                    { value: "Executive", label: "Executive" },
                  ]}
                  disabled={isFetching}
                />
                <TextInput
                  label="ORG SLUG FILTER"
                  value={filters.linkedinOrgSlugFilter}
                  onChange={(v) => setFilter("linkedinOrgSlugFilter", v)}
                  placeholder="e.g. google,microsoft"
                  disabled={isFetching}
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <TriToggle label="DIRECT APPLY" value={filters.linkedinDirectApply} onChange={(v) => setFilter("linkedinDirectApply", v)} disabled={isFetching} />
              </div>
            </div>
          )}

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
              </>
            )}
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
                      {Boolean((s as Record<string, unknown>).weekdaysOnly) && <Badge className="text-xs font-mono bg-blue-500/20 text-blue-400 border-blue-500">MON-FRI</Badge>}
                      {s.lastRunAt && <span>Last run: {new Date(s.lastRunAt).toLocaleString()}</span>}
                      {s.nextRunAt && s.enabled && <span className="text-amber-400">Next: {new Date(s.nextRunAt).toLocaleString()}</span>}
                    </div>
                    {/* Query rotation info */}
                    {(() => {
                      const rot = (s as Record<string, unknown>).queryRotation;
                      if (rot && Array.isArray(rot)) {
                        return (
                          <div className="mt-1 text-xs font-mono text-purple-400">
                            <Zap size={10} className="inline mr-1" />
                            ROTATION: {rot.length} queries cycling daily
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <FetchDetails filters={s.filters} />
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
            <HistoryRow
              key={h.id}
              h={h as HistoryEntry}
              onConvert={(entry) => {
                const snap = (entry.filters ?? {}) as Record<string, unknown>;
                const reconstructed: Filters = {
                  ...defaultFilters(),
                  endpoint: (snap.endpoint as Filters["endpoint"]) ?? "active-ats-7d",
                  titleFilter: (snap.titleFilter as string) ?? "",
                  locationFilter: snap.locationFilter ? (typeof snap.locationFilter === "string" ? snap.locationFilter.split(" OR ") : (snap.locationFilter as string[])) : [],
                  descriptionFilter: (snap.descriptionFilter as string) ?? "",
                  organizationFilter: (snap.organizationFilter as string) ?? "",
                  limit: String(snap.limit ?? 100),
                  offset: String(snap.offset ?? 0),
                };
                setConvertingHistory({ id: entry.id, name: `Schedule from ${new Date(entry.ranAt).toLocaleDateString()}`, filters: reconstructed });
                setConvertName(`Schedule from ${new Date(entry.ranAt).toLocaleDateString()}`);
              }}
            />
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
