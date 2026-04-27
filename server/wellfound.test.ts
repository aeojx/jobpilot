import { describe, it, expect } from "vitest";
import { transformWellFoundJob } from "./db";

describe("WellFound Integration", () => {
  describe("transformWellFoundJob — new Apify format", () => {
    const newFormatJob = {
      job_id: "3826979",
      job_title: "Founding SaaS Engineer",
      job_type: "Full Time",
      job_compensation: "$130K – $170K",
      job_min_salary: 130000,
      job_max_salary: 170000,
      job_salary_currency: "USD",
      job_equity: "0.5% – 2.0%",
      job_remote: true,
      job_location: "Dubai",
      job_description: "We're looking for a Founding SaaS Engineer to join our team and build the core product.",
      job_url: "https://wellfound.com/jobs/3826979-founding-saas-engineer",
      job_application_url: "https://wellfound.com/jobs/3826979-founding-saas-engineer?autoOpenApplication=true",
      direct_application: true,
      visa_sponsorship: false,
      skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
      company: {
        name: "Yander",
        slug: "yander",
        location: "Dubai",
        size: "1-10",
        category: ["SaaS", "B2B"],
        profile_url: "https://wellfound.com/company/yander",
        url: "https://yanderlabs.com",
      },
    };

    it("extracts job_title correctly", () => {
      const result = transformWellFoundJob(newFormatJob as any);
      expect(result.title).toBe("Founding SaaS Engineer");
    });

    it("extracts job_application_url as applyUrl", () => {
      const result = transformWellFoundJob(newFormatJob as any);
      expect(result.applyUrl).toBe("https://wellfound.com/jobs/3826979-founding-saas-engineer?autoOpenApplication=true");
    });

    it("extracts company name from company object", () => {
      const result = transformWellFoundJob(newFormatJob as any);
      expect(result.company).toBe("Yander");
    });

    it("extracts job_location correctly", () => {
      const result = transformWellFoundJob(newFormatJob as any);
      expect(result.location).toBe("Dubai");
    });

    it("uses job_id as externalId", () => {
      const result = transformWellFoundJob(newFormatJob as any);
      expect(result.externalId).toBe("3826979");
    });

    it("extracts job_description correctly", () => {
      const result = transformWellFoundJob(newFormatJob as any);
      expect(result.description).toContain("Founding SaaS Engineer");
    });

    it("sets source to wellfound", () => {
      const result = transformWellFoundJob(newFormatJob as any);
      expect(result.source).toBe("wellfound");
    });

    it("sets status to matched", () => {
      const result = transformWellFoundJob(newFormatJob as any);
      expect(result.status).toBe("matched");
    });

    it("stores rawJson with new format fields", () => {
      const result = transformWellFoundJob(newFormatJob as any);
      const raw = JSON.parse(result.rawJson as string);
      expect(raw.job_id).toBe("3826979");
      expect(raw.job_title).toBe("Founding SaaS Engineer");
      expect(raw.job_url).toBe("https://wellfound.com/jobs/3826979-founding-saas-engineer");
      expect(raw.job_application_url).toBe("https://wellfound.com/jobs/3826979-founding-saas-engineer?autoOpenApplication=true");
    });
  });

  describe("transformWellFoundJob — title fallback from URL slug", () => {
    it("extracts title from job_url when job_title is missing", () => {
      const job = {
        job_id: "3826979",
        job_url: "https://wellfound.com/jobs/3826979-founding-saas-engineer",
        job_application_url: "https://wellfound.com/jobs/3826979-founding-saas-engineer?autoOpenApplication=true",
        company: { name: "TestCo" },
      };
      const result = transformWellFoundJob(job as any);
      expect(result.title).toBe("Founding Saas Engineer");
      expect(result.title).not.toBe("Unknown Position");
    });

    it("falls back to Unknown Position when no title source available", () => {
      const job = {
        job_id: "3826979", // numeric only, no slug
        company: { name: "TestCo" },
      };
      const result = transformWellFoundJob(job as any);
      // job_id is numeric only, no URL — should fall back
      expect(result.title).toBe("Unknown Position");
    });
  });

  describe("transformWellFoundJob — URL fallback", () => {
    it("uses job_url when job_application_url is missing", () => {
      const job = {
        job_id: "3826979",
        job_title: "Engineer",
        job_url: "https://wellfound.com/jobs/3826979-engineer",
        company: { name: "Co" },
      };
      const result = transformWellFoundJob(job as any);
      expect(result.applyUrl).toBe("https://wellfound.com/jobs/3826979-engineer");
    });

    it("constructs URL from job_id when no URL fields present", () => {
      const job = {
        job_id: "3826979",
        job_title: "Engineer",
        company: { name: "Co" },
      };
      const result = transformWellFoundJob(job as any);
      expect(result.applyUrl).toBe("https://wellfound.com/jobs/3826979");
    });
  });

  describe("transformWellFoundJob — legacy format backward compatibility", () => {
    it("handles legacy string company field", () => {
      const job = {
        id: "4129433-senior-product-manager",
        title: "Senior Product Manager",
        company: "OldCo",
        location: "San Francisco",
        link: "https://wellfound.com/jobs/4129433-senior-product-manager",
        description: "Looking for a Senior PM...",
      };
      const result = transformWellFoundJob(job as any);
      expect(result.title).toBe("Senior Product Manager");
      expect(result.company).toBe("OldCo");
      expect(result.applyUrl).toBe("https://wellfound.com/jobs/4129433-senior-product-manager");
      expect(result.location).toBe("San Francisco");
    });

    it("extracts title from legacy id slug when title is missing", () => {
      const job = {
        id: "4129433-senior-product-manager",
        company: "OldCo",
        link: "https://wellfound.com/jobs/4129433-senior-product-manager",
      };
      const result = transformWellFoundJob(job as any);
      expect(result.title).toBe("Senior Product Manager");
    });
  });

  describe("transformWellFoundJob — company location fallback", () => {
    it("uses company.location when job_location is missing", () => {
      const job = {
        job_id: "123",
        job_title: "Dev",
        company: { name: "Co", location: "London" },
      };
      const result = transformWellFoundJob(job as any);
      expect(result.location).toBe("London");
    });

    it("defaults to Remote when no location available", () => {
      const job = {
        job_id: "123",
        job_title: "Dev",
        company: { name: "Co" },
      };
      const result = transformWellFoundJob(job as any);
      expect(result.location).toBe("Remote");
    });
  });

  describe("transformWellFoundJob — synthetic description", () => {
    it("builds synthetic description when job_description is empty", () => {
      const job = {
        job_id: "123",
        job_title: "ML Engineer",
        job_location: "Dubai",
        job_type: "Full Time",
        job_compensation: "$100K",
        skills: ["Python", "TensorFlow"],
        company: { name: "AIStartup", size: "11-50", category: ["AI", "ML"] },
      };
      const result = transformWellFoundJob(job as any);
      expect(result.description).toContain("ML Engineer");
      expect(result.description).toContain("AIStartup");
      expect(result.description).toContain("Dubai");
      expect(result.description).toContain("$100K");
      expect(result.description).toContain("Python, TensorFlow");
    });
  });
});
