import { NextResponse } from "next/server";
import { getSsotState } from "../../../lib/supabaseSsot";

export async function GET() {
  const state = await getSsotState();
  return NextResponse.json(state);
}
