import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { ExplanationResponse } from "./types";

export const getGuestAccess = createServerFn({ method: "POST" }).handler(async () => {
  const server = await import("./guest-access.server");
  const request = server.verifyGuestOrigin();
  return { active: await server.readGuestAccess(request) };
});

export const startGuestAccess = createServerFn({ method: "POST" }).handler(async () => {
  const server = await import("./guest-access.server");
  return server.beginGuestAccess(server.verifyGuestOrigin());
});

export const requireAIAccess = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const server = await import("./guest-access.server");
  const request = getRequest();
  if (!await server.verifySignedInAI(request)) {
    server.verifyGuestOrigin();
    await server.consumeGuestAccess(request);
  }
  return next();
});

const requireGuestAccess = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const server = await import("./guest-access.server");
  const request = server.verifyGuestOrigin();
  await server.consumeGuestAccess(request);
  return next();
});

const prescriptionSchema = z.object({
  input: z.string().max(4000),
  simplify: z.boolean(),
  imageBase64: z.string().max(7 * 1024 * 1024).regex(/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/\r\n]+=*$/).optional(),
}).refine((data) => Boolean(data.input.trim() || data.imageBase64), "Enter a medication or upload a prescription.");

export const guestExplanation = createServerFn({ method: "POST" })
  .middleware([requireGuestAccess])
  .inputValidator(prescriptionSchema)
  .handler(async ({ data }): Promise<ExplanationResponse> => {
    const { invokeGuestMedication } = await import("./guest-access.server");
    return await invokeGuestMedication("explain-prescription", data) as ExplanationResponse;
  });

export interface ComparisonResult {
  summary: string;
  interactions: { severity: "low" | "moderate" | "high"; medications: string[]; description: string }[];
  combinedSideEffects: string[];
  safetyTips: string[];
}

export const guestComparison = createServerFn({ method: "POST" })
  .middleware([requireGuestAccess])
  .inputValidator(z.object({ medications: z.array(z.string().trim().min(1).max(200)).min(2).max(10) }))
  .handler(async ({ data }): Promise<ComparisonResult> => {
    const { invokeGuestMedication } = await import("./guest-access.server");
    return await invokeGuestMedication("compare-medications", data) as ComparisonResult;
  });