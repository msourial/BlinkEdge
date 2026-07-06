import type { NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { solanaService } from "@/lib/solana/SolanaTransactionService";

const DEVNET_CLUSTER = "devnet";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ marketId: string }> }
) {
  const { marketId } = await params;

  const actionGetResponse = {
    icon: "https://blinkedge.app/icon.svg",
    label: `Hedge bet on ${marketId}`,
    title: "Blink Hedge — Devnet",
    description:
      "Protect your capital with one tap. This Action transfers a demo 'hedge voucher' SPL token on devnet — no real value, no real risk.",
    links: {
      actions: [],
    },
  };

  return new Response(JSON.stringify(actionGetResponse), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ marketId: string }> }
) {
  const { marketId } = await params;

  try {
    const body = await request.json();
    const accountStr = body?.account;

    if (!accountStr || typeof accountStr !== "string") {
      return new Response(
        JSON.stringify({ message: "Missing 'account' field" }),
        {
          status: 400,
          headers: corsHeaders(),
        }
      );
    }

    let account: PublicKey;
    try {
      account = new PublicKey(accountStr);
    } catch {
      return new Response(
        JSON.stringify({ message: "Invalid account public key" }),
        {
          status: 400,
          headers: corsHeaders(),
        }
      );
    }

    const { transaction: base64Tx, message } =
      await solanaService.createHedgeTransaction(account, marketId);

    const actionPostResponse = {
      transaction: base64Tx,
      message,
      links: {
        next: {
          type: "post",
          href: `/api/actions/hedge/${marketId}/confirmed`,
          label: "Hedged ✓",
        },
      },
    };

    return new Response(JSON.stringify(actionPostResponse), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

function corsHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}