import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = { name: string; val: string; opts: Record<string, unknown> };

function makeCtx(cookieHeader = "") {
  const cookieCalls: CookieCall[] = [];
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: { cookie: cookieHeader },
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, val: string, opts: Record<string, unknown>) => {
        cookieCalls.push({ name, val, opts });
      },
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
  return { ctx, cookieCalls };
}

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

describe("gate", () => {
  it("check returns a boolean unlocked field", async () => {
    const { ctx } = makeCtx("");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gate.check();
    expect(typeof result.unlocked).toBe("boolean");
  });

  it("unlock rejects wrong password", async () => {
    const { ctx } = makeCtx("");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.gate.unlock({ password: "WRONG_PASSWORD_XYZ" })).rejects.toThrow();
  });

  it("unlock accepts correct password from env and sets cookie", async () => {
    const sitePassword = process.env.SITE_PASSWORD;
    if (!sitePassword) return; // no password set — gate is open, skip
    const { ctx, cookieCalls } = makeCtx("");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gate.unlock({ password: sitePassword });
    expect(result.success).toBe(true);
    // Cookie must have been set
    expect(cookieCalls).toHaveLength(1);
    const call = cookieCalls[0]!;
    expect(call.name).toBe("jp_gate");
    // maxAge must be 30 days in milliseconds
    expect(call.opts.maxAge).toBe(THIRTY_DAYS_MS);
    expect(call.opts.httpOnly).toBe(true);
    expect(call.opts.path).toBe("/");
  });

  it("check returns unlocked=true when correct cookie is present", async () => {
    const sitePassword = process.env.SITE_PASSWORD;
    if (!sitePassword) return;
    const { ctx } = makeCtx(`jp_gate=${sitePassword}`);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gate.check();
    expect(result.unlocked).toBe(true);
  });

  it("check returns unlocked=false when wrong cookie is present", async () => {
    const sitePassword = process.env.SITE_PASSWORD;
    if (!sitePassword) return;
    const { ctx } = makeCtx("jp_gate=wrong_token");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gate.check();
    expect(result.unlocked).toBe(false);
  });

  it("check returns unlocked=false when no cookie is present and password is set", async () => {
    const sitePassword = process.env.SITE_PASSWORD;
    if (!sitePassword) return;
    const { ctx } = makeCtx("");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gate.check();
    expect(result.unlocked).toBe(false);
  });
});
