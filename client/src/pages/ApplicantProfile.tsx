import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, User, Briefcase, DollarSign, Shield, Clock, Code, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PersonalInfo {
  fullName: string;
  preferredName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
}

interface WorkAuth {
  legallyAuthorized: string;
  requireSponsorship: string;
  workPermitType: string;
}

interface Compensation {
  salaryExpectation: string;
  salaryCurrency: string;
  salaryRangeMin: string;
  salaryRangeMax: string;
}

interface Experience {
  yearsTotal: string;
  educationLevel: string;
  currentTitle: string;
  targetRole: string;
}

interface EEO {
  gender: string;
  raceEthnicity: string;
  veteranStatus: string;
  disabilityStatus: string;
}

interface Availability {
  earliestStart: string;
  fullTime: string;
  contract: string;
}

interface SkillsBoundary {
  languages: string[];
  frameworks: string[];
  devops: string[];
  databases: string[];
  tools: string[];
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const defaultPersonal: PersonalInfo = {
  fullName: "", preferredName: "", email: "", password: "", phone: "",
  address: "", city: "", provinceState: "", country: "", postalCode: "",
  linkedinUrl: "", githubUrl: "", portfolioUrl: "", websiteUrl: "",
};

const defaultWorkAuth: WorkAuth = {
  legallyAuthorized: "Yes", requireSponsorship: "No", workPermitType: "",
};

const defaultCompensation: Compensation = {
  salaryExpectation: "", salaryCurrency: "USD", salaryRangeMin: "", salaryRangeMax: "",
};

const defaultExperience: Experience = {
  yearsTotal: "", educationLevel: "", currentTitle: "", targetRole: "",
};

const defaultEEO: EEO = {
  gender: "Decline to self-identify",
  raceEthnicity: "Decline to self-identify",
  veteranStatus: "Decline to self-identify",
  disabilityStatus: "Decline to self-identify",
};

const defaultAvailability: Availability = {
  earliestStart: "Immediately", fullTime: "Yes", contract: "No",
};

const defaultSkills: SkillsBoundary = {
  languages: [], frameworks: [], devops: [], databases: [], tools: [],
};

// ─── Reusable Components ────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, open, onToggle }: {
  icon: React.ElementType; title: string; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 mb-2"
      style={{
        background: "rgba(255,176,0,0.06)",
        border: "1px solid var(--atari-border)",
        cursor: "pointer",
      }}
    >
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: "var(--atari-amber)" }} />
        <span className="font-pixel" style={{ color: "var(--atari-amber)", fontSize: "10px", letterSpacing: "0.1em" }}>
          {title}
        </span>
      </div>
      {open ? <ChevronUp size={14} style={{ color: "var(--atari-gray)" }} /> : <ChevronDown size={14} style={{ color: "var(--atari-gray)" }} />}
    </button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs mb-1" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono", letterSpacing: "0.05em" }}>
        {label} {required && <span style={{ color: "var(--atari-red)" }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-xs"
        style={{
          background: "var(--atari-black)",
          border: "1px solid var(--atari-border)",
          color: "var(--atari-white)",
          fontFamily: "Share Tech Mono",
          outline: "none",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--atari-amber)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--atari-border)"; }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs mb-1" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-xs"
        style={{
          background: "var(--atari-black)",
          border: "1px solid var(--atari-border)",
          color: "var(--atari-white)",
          fontFamily: "Share Tech Mono",
          outline: "none",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function TagInput({ label, tags, onChange }: {
  label: string; tags: string[]; onChange: (t: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  return (
    <div className="mb-3">
      <label className="block text-xs mb-1" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <div className="flex gap-1 flex-wrap mb-1">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs"
            style={{
              border: "1px solid var(--atari-cyan)",
              color: "var(--atari-cyan)",
              fontFamily: "Share Tech Mono",
              fontSize: "10px",
            }}
          >
            {tag}
            <button
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              style={{ color: "var(--atari-red)", cursor: "pointer", background: "none", border: "none", padding: 0 }}
            >
              x
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="Type and press Enter"
          className="flex-1 px-2 py-1 text-xs"
          style={{
            background: "var(--atari-black)",
            border: "1px solid var(--atari-border)",
            color: "var(--atari-white)",
            fontFamily: "Share Tech Mono",
            outline: "none",
          }}
        />
        <button
          onClick={addTag}
          className="px-2 py-1 text-xs"
          style={{
            background: "transparent",
            border: "1px solid var(--atari-amber)",
            color: "var(--atari-amber)",
            fontFamily: "Press Start 2P",
            fontSize: "8px",
            cursor: "pointer",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ApplicantProfile() {
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const upsertMutation = trpc.profile.upsert.useMutation();
  const utils = trpc.useUtils();

  const [personal, setPersonal] = useState<PersonalInfo>(defaultPersonal);
  const [workAuth, setWorkAuth] = useState<WorkAuth>(defaultWorkAuth);
  const [compensation, setCompensation] = useState<Compensation>(defaultCompensation);
  const [experience, setExperience] = useState<Experience>(defaultExperience);
  const [eeo, setEEO] = useState<EEO>(defaultEEO);
  const [availability, setAvailability] = useState<Availability>(defaultAvailability);
  const [skills, setSkills] = useState<SkillsBoundary>(defaultSkills);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    personal: true, workAuth: false, compensation: false,
    experience: false, eeo: false, availability: false, skills: false,
  });

  const toggle = (key: string) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  // Hydrate from server
  useEffect(() => {
    if (profile) {
      if (profile.personal) setPersonal({ ...defaultPersonal, ...(profile.personal as any) });
      if (profile.workAuth) setWorkAuth({ ...defaultWorkAuth, ...(profile.workAuth as any) });
      if (profile.compensation) setCompensation({ ...defaultCompensation, ...(profile.compensation as any) });
      if (profile.experience) setExperience({ ...defaultExperience, ...(profile.experience as any) });
      if (profile.eeo) setEEO({ ...defaultEEO, ...(profile.eeo as any) });
      if (profile.availability) setAvailability({ ...defaultAvailability, ...(profile.availability as any) });
      if (profile.skillsBoundary) setSkills({ ...defaultSkills, ...(profile.skillsBoundary as any) });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await upsertMutation.mutateAsync({
        personal, workAuth, compensation, experience, eeo, availability, skillsBoundary: skills,
      });
      utils.profile.get.invalidate();
      toast.success("Profile saved successfully");
    } catch (err) {
      toast.error("Failed to save profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-pixel text-xs" style={{ color: "var(--atari-amber)" }}>LOADING PROFILE<span className="blink">_</span></p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-pixel" style={{ color: "var(--atari-amber)", fontSize: "16px" }}>
            APPLICANT PROFILE
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono" }}>
            This data is used by AutoApply to fill in job applications automatically.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={upsertMutation.isPending}
          className="flex items-center gap-2 px-4 py-2"
          style={{
            background: upsertMutation.isPending ? "var(--atari-border)" : "transparent",
            border: "2px solid var(--atari-green)",
            color: "var(--atari-green)",
            fontFamily: "Press Start 2P",
            fontSize: "9px",
            cursor: upsertMutation.isPending ? "wait" : "pointer",
            letterSpacing: "0.08em",
          }}
        >
          <Save size={12} />
          {upsertMutation.isPending ? "SAVING..." : "SAVE ALL"}
        </button>
      </div>

      <div className="atari-divider mb-6" />

      {/* Personal Information */}
      <SectionHeader icon={User} title="PERSONAL INFORMATION" open={!!openSections.personal} onToggle={() => toggle("personal")} />
      {openSections.personal && (
        <div className="px-4 pb-4 mb-4" style={{ border: "1px solid var(--atari-border)", borderTop: "none" }}>
          <div className="grid grid-cols-2 gap-x-4 pt-3">
            <Field label="Full Name" value={personal.fullName} onChange={(v) => setPersonal({ ...personal, fullName: v })} required />
            <Field label="Preferred Name" value={personal.preferredName} onChange={(v) => setPersonal({ ...personal, preferredName: v })} />
            <Field label="Email" value={personal.email} onChange={(v) => setPersonal({ ...personal, email: v })} type="email" required />
            <Field label="ATS Password" value={personal.password} onChange={(v) => setPersonal({ ...personal, password: v })} type="password" placeholder="For auto-creating ATS accounts" />
            <Field label="Phone" value={personal.phone} onChange={(v) => setPersonal({ ...personal, phone: v })} required />
            <Field label="Address" value={personal.address} onChange={(v) => setPersonal({ ...personal, address: v })} />
            <Field label="City" value={personal.city} onChange={(v) => setPersonal({ ...personal, city: v })} />
            <Field label="Province / State" value={personal.provinceState} onChange={(v) => setPersonal({ ...personal, provinceState: v })} />
            <Field label="Country" value={personal.country} onChange={(v) => setPersonal({ ...personal, country: v })} />
            <Field label="Postal Code" value={personal.postalCode} onChange={(v) => setPersonal({ ...personal, postalCode: v })} />
          </div>
          <div className="atari-divider my-3" />
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="LinkedIn URL" value={personal.linkedinUrl} onChange={(v) => setPersonal({ ...personal, linkedinUrl: v })} placeholder="https://linkedin.com/in/..." />
            <Field label="GitHub URL" value={personal.githubUrl} onChange={(v) => setPersonal({ ...personal, githubUrl: v })} placeholder="https://github.com/..." />
            <Field label="Portfolio URL" value={personal.portfolioUrl} onChange={(v) => setPersonal({ ...personal, portfolioUrl: v })} />
            <Field label="Website URL" value={personal.websiteUrl} onChange={(v) => setPersonal({ ...personal, websiteUrl: v })} />
          </div>
        </div>
      )}

      {/* Work Authorization */}
      <SectionHeader icon={Shield} title="WORK AUTHORIZATION" open={!!openSections.workAuth} onToggle={() => toggle("workAuth")} />
      {openSections.workAuth && (
        <div className="px-4 pb-4 mb-4" style={{ border: "1px solid var(--atari-border)", borderTop: "none" }}>
          <div className="grid grid-cols-2 gap-x-4 pt-3">
            <SelectField label="Legally Authorized to Work" value={workAuth.legallyAuthorized} onChange={(v) => setWorkAuth({ ...workAuth, legallyAuthorized: v })} options={["Yes", "No"]} />
            <SelectField label="Require Sponsorship" value={workAuth.requireSponsorship} onChange={(v) => setWorkAuth({ ...workAuth, requireSponsorship: v })} options={["Yes", "No"]} />
            <Field label="Work Permit Type" value={workAuth.workPermitType} onChange={(v) => setWorkAuth({ ...workAuth, workPermitType: v })} placeholder="e.g., H-1B, PR, Citizen" />
          </div>
        </div>
      )}

      {/* Compensation */}
      <SectionHeader icon={DollarSign} title="COMPENSATION" open={!!openSections.compensation} onToggle={() => toggle("compensation")} />
      {openSections.compensation && (
        <div className="px-4 pb-4 mb-4" style={{ border: "1px solid var(--atari-border)", borderTop: "none" }}>
          <div className="grid grid-cols-2 gap-x-4 pt-3">
            <Field label="Salary Expectation" value={compensation.salaryExpectation} onChange={(v) => setCompensation({ ...compensation, salaryExpectation: v })} placeholder="e.g., 150000" />
            <SelectField label="Currency" value={compensation.salaryCurrency} onChange={(v) => setCompensation({ ...compensation, salaryCurrency: v })} options={["USD", "CAD", "EUR", "GBP", "AUD"]} />
            <Field label="Range Min" value={compensation.salaryRangeMin} onChange={(v) => setCompensation({ ...compensation, salaryRangeMin: v })} placeholder="e.g., 130000" />
            <Field label="Range Max" value={compensation.salaryRangeMax} onChange={(v) => setCompensation({ ...compensation, salaryRangeMax: v })} placeholder="e.g., 180000" />
          </div>
        </div>
      )}

      {/* Experience */}
      <SectionHeader icon={Briefcase} title="EXPERIENCE" open={!!openSections.experience} onToggle={() => toggle("experience")} />
      {openSections.experience && (
        <div className="px-4 pb-4 mb-4" style={{ border: "1px solid var(--atari-border)", borderTop: "none" }}>
          <div className="grid grid-cols-2 gap-x-4 pt-3">
            <Field label="Total Years of Experience" value={experience.yearsTotal} onChange={(v) => setExperience({ ...experience, yearsTotal: v })} />
            <SelectField label="Education Level" value={experience.educationLevel} onChange={(v) => setExperience({ ...experience, educationLevel: v })} options={["High School", "Associate", "Bachelor's", "Master's", "PhD", "Other"]} />
            <Field label="Current Title" value={experience.currentTitle} onChange={(v) => setExperience({ ...experience, currentTitle: v })} />
            <Field label="Target Role" value={experience.targetRole} onChange={(v) => setExperience({ ...experience, targetRole: v })} />
          </div>
        </div>
      )}

      {/* EEO */}
      <SectionHeader icon={Shield} title="EEO / VOLUNTARY SELF-IDENTIFICATION" open={!!openSections.eeo} onToggle={() => toggle("eeo")} />
      {openSections.eeo && (
        <div className="px-4 pb-4 mb-4" style={{ border: "1px solid var(--atari-border)", borderTop: "none" }}>
          <p className="text-xs pt-3 mb-3" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono" }}>
            These answers are used for voluntary EEO questions. Default: "Decline to self-identify".
          </p>
          <div className="grid grid-cols-2 gap-x-4">
            <SelectField label="Gender" value={eeo.gender} onChange={(v) => setEEO({ ...eeo, gender: v })} options={["Decline to self-identify", "Male", "Female", "Non-binary", "Other"]} />
            <SelectField label="Race / Ethnicity" value={eeo.raceEthnicity} onChange={(v) => setEEO({ ...eeo, raceEthnicity: v })} options={["Decline to self-identify", "White", "Black or African American", "Hispanic or Latino", "Asian", "American Indian or Alaska Native", "Native Hawaiian or Pacific Islander", "Two or More Races"]} />
            <SelectField label="Veteran Status" value={eeo.veteranStatus} onChange={(v) => setEEO({ ...eeo, veteranStatus: v })} options={["Decline to self-identify", "I am not a veteran", "I am a veteran", "I am a protected veteran"]} />
            <SelectField label="Disability Status" value={eeo.disabilityStatus} onChange={(v) => setEEO({ ...eeo, disabilityStatus: v })} options={["Decline to self-identify", "No, I do not have a disability", "Yes, I have a disability", "I do not wish to answer"]} />
          </div>
        </div>
      )}

      {/* Availability */}
      <SectionHeader icon={Clock} title="AVAILABILITY" open={!!openSections.availability} onToggle={() => toggle("availability")} />
      {openSections.availability && (
        <div className="px-4 pb-4 mb-4" style={{ border: "1px solid var(--atari-border)", borderTop: "none" }}>
          <div className="grid grid-cols-2 gap-x-4 pt-3">
            <Field label="Earliest Start Date" value={availability.earliestStart} onChange={(v) => setAvailability({ ...availability, earliestStart: v })} placeholder="Immediately / 2 weeks / etc." />
            <SelectField label="Full-Time" value={availability.fullTime} onChange={(v) => setAvailability({ ...availability, fullTime: v })} options={["Yes", "No"]} />
            <SelectField label="Open to Contract" value={availability.contract} onChange={(v) => setAvailability({ ...availability, contract: v })} options={["Yes", "No"]} />
          </div>
        </div>
      )}

      {/* Skills Boundary */}
      <SectionHeader icon={Code} title="SKILLS BOUNDARY" open={!!openSections.skills} onToggle={() => toggle("skills")} />
      {openSections.skills && (
        <div className="px-4 pb-4 mb-4" style={{ border: "1px solid var(--atari-border)", borderTop: "none" }}>
          <p className="text-xs pt-3 mb-3" style={{ color: "var(--atari-gray)", fontFamily: "Share Tech Mono" }}>
            The agent will only claim proficiency in skills listed here.
          </p>
          <TagInput label="Programming Languages" tags={skills.languages} onChange={(t) => setSkills({ ...skills, languages: t })} />
          <TagInput label="Frameworks" tags={skills.frameworks} onChange={(t) => setSkills({ ...skills, frameworks: t })} />
          <TagInput label="DevOps / Cloud" tags={skills.devops} onChange={(t) => setSkills({ ...skills, devops: t })} />
          <TagInput label="Databases" tags={skills.databases} onChange={(t) => setSkills({ ...skills, databases: t })} />
          <TagInput label="Tools / Other" tags={skills.tools} onChange={(t) => setSkills({ ...skills, tools: t })} />
        </div>
      )}

      {/* Bottom Save */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={upsertMutation.isPending}
          className="flex items-center gap-2 px-6 py-3"
          style={{
            background: "transparent",
            border: "2px solid var(--atari-green)",
            color: "var(--atari-green)",
            fontFamily: "Press Start 2P",
            fontSize: "10px",
            cursor: upsertMutation.isPending ? "wait" : "pointer",
            letterSpacing: "0.08em",
          }}
        >
          <Save size={14} />
          {upsertMutation.isPending ? "SAVING..." : "SAVE PROFILE"}
        </button>
      </div>
    </div>
  );
}
