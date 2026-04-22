import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();
export type RouterOutputs = inferRouterOutputs<AppRouter>;
// Kanban job type — stripped of heavy blob columns (description, descriptionHtml, rawJson)
export type KanbanJob = RouterOutputs["jobs"]["kanban"][number];
