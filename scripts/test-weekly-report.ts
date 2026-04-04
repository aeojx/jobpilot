import "dotenv/config";
import { sendWeeklyReport } from "../server/routers";

async function main() {
  console.log("[Test] Calling sendWeeklyReport...");
  await sendWeeklyReport();
  console.log("[Test] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Test] Error:", err);
  process.exit(1);
});
