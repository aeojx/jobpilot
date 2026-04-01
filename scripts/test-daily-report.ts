import "dotenv/config";
import { sendDailyReport, sendWeeklyReport } from "../server/routers";

async function main() {
  const arg = process.argv[2] ?? "daily";
  if (arg === "weekly") {
    console.log("[Test] Calling sendWeeklyReport...");
    await sendWeeklyReport();
  } else {
    console.log("[Test] Calling sendDailyReport...");
    await sendDailyReport();
  }
  console.log("[Test] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Test] Error:", err);
  process.exit(1);
});
