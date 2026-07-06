import { NextResponse } from "next/server";

export function GET() {
  const actionsJson = {
    rules: [
      {
        pathPattern: "/api/actions/hedge/**",
        apiPath: "/api/actions/hedge/**",
      },
    ],
  };

  return new NextResponse(JSON.stringify(actionsJson), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}