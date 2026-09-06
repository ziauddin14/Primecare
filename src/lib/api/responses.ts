import { NextResponse } from "next/server";

export function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ ok: false, message }, { status: 404 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ ok: false, message }, { status: 403 });
}

export function conflict(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 409 });
}

export function serverError(err: unknown, context: string) {
  // Log the real error server-side only; the client never sees Mongo
  // internals, stack traces, or connection details.
  console.error(context, err);
  return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
}

export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}
