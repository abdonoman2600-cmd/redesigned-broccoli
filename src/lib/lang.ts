import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";

export type Lang = "ar" | "en";

export const getLang = cache(async (): Promise<Lang> => {
  const v = (await cookies()).get("lang")?.value;
  return v === "en" ? "en" : "ar";
});
