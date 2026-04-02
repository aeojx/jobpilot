/**
 * Retroactively score all matched jobs with score 0.
 * Run with: npx tsx scripts/rescore-unscored.ts
 */
import "../server/_core/env.ts";
import { getSkillsProfile, updateJobMatchScore } from "../server/db.ts";
import { scoreJobWithLLM } from "../server/routers.ts";
import { getDb } from "../server/db.ts";
import { jobs } from "../drizzle/schema.ts";
import { eq, and, or, isNull } from "drizzle-orm";

async function main() {
  const skills = await getSkillsProfile();
  if (!skills) {
    console.error("No skills profile found. Upload one first.");
    process.exit(1);
  }

  const db = await getDb();
  const unscored = await db
    .select()
    .from(jobs)
    .where(
      and(
        eq(jobs.status, "matched"),
        or(eq(jobs.matchScore, 0), isNull(jobs.matchScore))
      )
    );

  console.log(`Found ${unscored.length} unscored matched jobs. Scoring...`);
  let done = 0;
  let failed = 0;

  for (const job of unscored) {
    if (!job.description) { failed++; continue; }
    try {
      const result = await scoreJobWithLLM(job.description, skills, job.title ?? undefined, job.company ?? undefined);
      await updateJobMatchScore(job.id, result.composite, {
        scoreSkills: result.scoreSkills,
        scoreSeniority: result.scoreSeniority,
        scoreLocation: result.scoreLocation,
        scoreIndustry: result.scoreIndustry,
        scoreCompensation: result.scoreCompensation,
        dealBreakerMatched: result.dealBreakerMatched,
      });
      done++;
      if (done % 10 === 0) console.log(`  ${done}/${unscored.length} scored...`);
    } catch (err) {
      console.error(`  Failed job ${job.id}:`, (err as Error).message);
      failed++;
    }
  }

  console.log(`Done. Scored: ${done}, Failed: ${failed}`);
  process.exit(0);
}

main();
