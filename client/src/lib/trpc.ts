import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();
export type RouterOutputs = inferRouterOutputs<AppRouter>;
/** Same shape as `resume.status` / `resume.statusBatch` values */
export type ResumeStatusPayload = RouterOutputs["resume"]["status"];
// Kanban job type — stripped of heavy blob columns (description, descriptionHtml, rawJson)
export type KanbanJob = RouterOutputs["jobs"]["kanban"][number];
