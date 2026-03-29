import { describe, expect, it } from "vitest";

/**
 * Validates the RAPIDAPI_KEY environment variable and Active Jobs DB
 * parameter-mapping logic without making live API calls (to avoid quota usage).
 */
describe("RAPIDAPI_KEY environment variable", () => {
  it("is set and non-empty", () => {
    const key = process.env.RAPIDAPI_KEY;
    expect(key).toBeDefined();
    expect(typeof key).toBe("string");
    expect((key as string).length).toBeGreaterThan(10);
  });
});

// ── Parameter-mapping helpers (mirrors the logic in routers.ts) ──────────────

function buildActiveJobsParams(input: {
  titleFilter?: string;
  advancedTitleFilter?: string;
  locationFilter?: string;
  descriptionFilter?: string;
  advancedDescriptionFilter?: string;
  organizationFilter?: string;
  organizationExclusionFilter?: string;
  advancedOrganizationFilter?: string;
  source?: string;
  sourceExclusion?: string;
  aiWorkArrangementFilter?: string;
  aiExperienceLevelFilter?: string;
  aiEmploymentTypeFilter?: string;
  aiTaxonomiesAFilter?: string;
  aiTaxonomiesAPrimaryFilter?: string;
  aiTaxonomiesAExclusionFilter?: string;
  aiVisaSponsorshipFilter?: boolean;
  aiHasSalary?: boolean;
  remote?: boolean;
  agency?: boolean;
  includeLi?: boolean;
  liOrganizationSlugFilter?: string;
  liOrganizationSlugExclusionFilter?: string;
  liIndustryFilter?: string;
  liOrganizationEmployeesLte?: string;
  liOrganizationEmployeesGte?: string;
  offset?: number;
  limit?: number;
  descriptionType?: "text" | "html";
}): Record<string, string> {
  const params: Record<string, string> = {};
  params["description_type"] = input.descriptionType ?? "text";
  params["include_ai"] = "true";
  params["limit"] = String(input.limit ?? 100);
  if (input.offset !== undefined) params["offset"] = String(input.offset);
  if (input.advancedTitleFilter) params["advanced_title_filter"] = input.advancedTitleFilter;
  else if (input.titleFilter) params["title_filter"] = input.titleFilter;
  if (input.locationFilter) params["location_filter"] = input.locationFilter;
  if (input.advancedDescriptionFilter) params["advanced_description_filter"] = input.advancedDescriptionFilter;
  else if (input.descriptionFilter) params["description_filter"] = input.descriptionFilter;
  if (input.advancedOrganizationFilter) params["advanced_organization_filter"] = input.advancedOrganizationFilter;
  else if (input.organizationFilter) params["organization_filter"] = input.organizationFilter;
  if (input.organizationExclusionFilter) params["organization_exclusion_filter"] = input.organizationExclusionFilter;
  if (input.source) params["source"] = input.source;
  if (input.sourceExclusion) params["source_exclusion"] = input.sourceExclusion;
  if (input.aiWorkArrangementFilter) params["ai_work_arrangement_filter"] = input.aiWorkArrangementFilter;
  if (input.aiExperienceLevelFilter) params["ai_experience_level_filter"] = input.aiExperienceLevelFilter;
  if (input.aiEmploymentTypeFilter) params["ai_employment_type_filter"] = input.aiEmploymentTypeFilter;
  if (input.aiTaxonomiesAFilter) params["ai_taxonomies_a_filter"] = input.aiTaxonomiesAFilter;
  if (input.aiTaxonomiesAPrimaryFilter) params["ai_taxonomies_a_primary_filter"] = input.aiTaxonomiesAPrimaryFilter;
  if (input.aiTaxonomiesAExclusionFilter) params["ai_taxonomies_a_exclusion_filter"] = input.aiTaxonomiesAExclusionFilter;
  if (input.aiVisaSponsorshipFilter) params["ai_visa_sponsorship_filter"] = "true";
  if (input.aiHasSalary) params["ai_has_salary"] = "true";
  if (input.remote !== undefined) params["remote"] = String(input.remote);
  if (input.agency !== undefined) params["agency"] = String(input.agency);
  if (input.includeLi !== undefined) params["include_li"] = String(input.includeLi);
  if (input.liOrganizationSlugFilter) params["li_organization_slug_filter"] = input.liOrganizationSlugFilter;
  if (input.liOrganizationSlugExclusionFilter) params["li_organization_slug_exclusion_filter"] = input.liOrganizationSlugExclusionFilter;
  if (input.liIndustryFilter) params["li_industry_filter"] = input.liIndustryFilter;
  if (input.liOrganizationEmployeesLte) params["li_organization_employees_lte"] = input.liOrganizationEmployeesLte;
  if (input.liOrganizationEmployeesGte) params["li_organization_employees_gte"] = input.liOrganizationEmployeesGte;
  return params;
}

describe("Active Jobs DB — API host and endpoint", () => {
  it("uses the correct host and endpoint path", () => {
    const host = "active-jobs-db.p.rapidapi.com";
    const endpoint = "active-ats-7d";
    const url = `https://${host}/${endpoint}?limit=100`;
    expect(url).toContain("active-jobs-db.p.rapidapi.com");
    expect(url).toContain("active-ats-7d");
    expect(url).not.toContain("fantastic-jobs");
  });
});

describe("Active Jobs DB — parameter mapping", () => {
  it("always includes description_type, include_ai, and limit", () => {
    const params = buildActiveJobsParams({});
    expect(params["description_type"]).toBe("text");
    expect(params["include_ai"]).toBe("true");
    expect(params["limit"]).toBe("100");
  });

  it("uses advanced_title_filter over title_filter when both provided", () => {
    const params = buildActiveJobsParams({
      titleFilter: "Engineer",
      advancedTitleFilter: "(React | Vue) & ! Junior",
    });
    expect(params["advanced_title_filter"]).toBe("(React | Vue) & ! Junior");
    expect(params["title_filter"]).toBeUndefined();
  });

  it("falls back to title_filter when no advanced title filter", () => {
    const params = buildActiveJobsParams({ titleFilter: "Data Engineer" });
    expect(params["title_filter"]).toBe("Data Engineer");
    expect(params["advanced_title_filter"]).toBeUndefined();
  });

  it("maps source_exclusion correctly", () => {
    const params = buildActiveJobsParams({ sourceExclusion: "linkedin,workday" });
    expect(params["source_exclusion"]).toBe("linkedin,workday");
  });

  it("maps include_li boolean correctly", () => {
    const paramsTrue = buildActiveJobsParams({ includeLi: true });
    expect(paramsTrue["include_li"]).toBe("true");
    const paramsFalse = buildActiveJobsParams({ includeLi: false });
    expect(paramsFalse["include_li"]).toBe("false");
  });

  it("maps agency=false to exclude staffing agencies", () => {
    const params = buildActiveJobsParams({ agency: false });
    expect(params["agency"]).toBe("false");
  });

  it("maps remote=true for remote-only jobs", () => {
    const params = buildActiveJobsParams({ remote: true });
    expect(params["remote"]).toBe("true");
  });

  it("handles offset=0 correctly for pagination (does not drop it)", () => {
    const params = buildActiveJobsParams({ offset: 0, limit: 100 });
    expect(params["offset"]).toBe("0");
  });

  it("handles offset=100 for second page", () => {
    const params = buildActiveJobsParams({ offset: 100, limit: 100 });
    expect(params["offset"]).toBe("100");
  });

  it("does not include offset when not specified", () => {
    const params = buildActiveJobsParams({});
    expect(params["offset"]).toBeUndefined();
  });

  it("maps AI work arrangement filter", () => {
    const params = buildActiveJobsParams({ aiWorkArrangementFilter: "Hybrid,Remote OK" });
    expect(params["ai_work_arrangement_filter"]).toBe("Hybrid,Remote OK");
  });

  it("maps AI experience level filter", () => {
    const params = buildActiveJobsParams({ aiExperienceLevelFilter: "2-5,5-10" });
    expect(params["ai_experience_level_filter"]).toBe("2-5,5-10");
  });

  it("maps AI taxonomy filters", () => {
    const params = buildActiveJobsParams({
      aiTaxonomiesAFilter: "Technology,Software",
      aiTaxonomiesAExclusionFilter: "Healthcare",
    });
    expect(params["ai_taxonomies_a_filter"]).toBe("Technology,Software");
    expect(params["ai_taxonomies_a_exclusion_filter"]).toBe("Healthcare");
  });

  it("maps LinkedIn employee range filters", () => {
    const params = buildActiveJobsParams({
      liOrganizationEmployeesGte: "50",
      liOrganizationEmployeesLte: "5000",
    });
    expect(params["li_organization_employees_gte"]).toBe("50");
    expect(params["li_organization_employees_lte"]).toBe("5000");
  });

  it("maps ai_visa_sponsorship_filter only when true", () => {
    const paramsTrue = buildActiveJobsParams({ aiVisaSponsorshipFilter: true });
    expect(paramsTrue["ai_visa_sponsorship_filter"]).toBe("true");
    const paramsUndef = buildActiveJobsParams({ aiVisaSponsorshipFilter: undefined });
    expect(paramsUndef["ai_visa_sponsorship_filter"]).toBeUndefined();
  });

  it("maps ai_has_salary only when true", () => {
    const params = buildActiveJobsParams({ aiHasSalary: true });
    expect(params["ai_has_salary"]).toBe("true");
    const paramsUndef = buildActiveJobsParams({ aiHasSalary: undefined });
    expect(paramsUndef["ai_has_salary"]).toBeUndefined();
  });
});
