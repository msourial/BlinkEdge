import { createSerwistRoute } from "@serwist/turbopack";

const SW_OPTIONS = { swSrc: "app/sw.ts", useNativeEsbuild: true } as const;

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = false;

export async function generateStaticParams() {
  const params = await createSerwistRoute(SW_OPTIONS).generateStaticParams();
  return params.map((p) => ({ path: [p.path] }));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const serwistRoute = createSerwistRoute(SW_OPTIONS);
  const p = await params;
  const filePath = (p.path ?? []).join("/");
  return serwistRoute.GET(request, { params: Promise.resolve({ path: filePath }) });
}
