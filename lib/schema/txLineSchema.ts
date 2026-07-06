import { z } from "zod";

export const txLineEventSchema = z.object({
  type: z.enum(["goal", "card", "injury", "odds_change", "substitution"]),
  minute: z.number().int().min(0).max(120),
  team: z.string().optional(),
  player: z.string().optional(),
  cardType: z.enum(["yellow", "red"]).optional(),
});

export const txLineEventPacketSchema = z.object({
  matchId: z.string(),
  timestamp: z.number(),
  minute: z.number().int().min(0).max(120),
  score: z.object({
    home: z.number().int().min(0),
    away: z.number().int().min(0),
  }),
  possession: z.object({
    home: z.number().min(0).max(100),
    away: z.number().min(0).max(100),
  }),
  events: z.array(txLineEventSchema),
  oddsSnapshot: z.object({
    home: z.number().min(1),
    draw: z.number().min(1),
    away: z.number().min(1),
  }),
  consensus: z.object({
    direction: z.enum(["home", "draw", "away"]),
    confidence: z.number().min(0).max(1),
  }),
});

export type TxLineEvent = z.infer<typeof txLineEventSchema>;
export type TxLineEventPacket = z.infer<typeof txLineEventPacketSchema>;
