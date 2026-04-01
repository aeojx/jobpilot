import "dotenv/config";
import { sendDailyReport } from "../server/routers";

async function main() {
  console.log("[Test] Calling sendDailyReport...");
  await sendDailyReport();
  console.log("[Test] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Test] Error:", err);
  process.exit(1);
});
