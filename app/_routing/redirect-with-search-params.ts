import {
  redirect,
} from "next/navigation";

export type RouteSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export async function redirectWithSearchParams(
  destination: string,
  searchParams: RouteSearchParams,
): Promise<never> {
  const values = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const serialized = query.toString();

  redirect(
    serialized
      ? `${destination}?${serialized}`
      : destination,
  );
}
