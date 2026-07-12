export interface MatchSelection {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
}

export type AppState =
  | { phase: "LOADING" }
  | { phase: "TXLINE_AUTH" }
  | { phase: "MATCH_SELECT" }
  | { phase: "CAMERA_INIT"; selectedMatch: MatchSelection }
  | { phase: "AR_HUD_LIVE"; selectedMatch: MatchSelection }
  | { phase: "OFFLINE" }
  | { phase: "API_ERROR"; error: string };

export type AppAction =
  | { type: "LOADED" }
  | { type: "API_CONNECTED" }
  | { type: "SELECT_MATCH"; match: MatchSelection }
  | { type: "CAMERA_READY" }
  | { type: "GO_OFFLINE" }
  | { type: "API_ERROR"; error: string }
  | { type: "RETRY" }
  | { type: "GO_BACK" };

export function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (state.phase) {
    case "LOADING":
      switch (action.type) {
        case "LOADED":
          return { phase: "TXLINE_AUTH" };
        case "API_ERROR":
          return { phase: "API_ERROR", error: action.error };
        default:
          return state;
      }

    case "TXLINE_AUTH":
      switch (action.type) {
        case "API_CONNECTED":
          return { phase: "MATCH_SELECT" };
        case "API_ERROR":
          return { phase: "API_ERROR", error: action.error };
        default:
          return state;
      }

    case "MATCH_SELECT":
      switch (action.type) {
        case "SELECT_MATCH":
          return { phase: "CAMERA_INIT", selectedMatch: action.match };
        default:
          return state;
      }

    case "CAMERA_INIT":
      switch (action.type) {
        case "CAMERA_READY":
          return { phase: "AR_HUD_LIVE", selectedMatch: state.selectedMatch };
        case "API_ERROR":
          return { phase: "API_ERROR", error: action.error };
        case "GO_OFFLINE":
          return { phase: "OFFLINE" };
        default:
          return state;
      }

    case "AR_HUD_LIVE":
      switch (action.type) {
        case "API_ERROR":
          return { phase: "API_ERROR", error: action.error };
        case "GO_OFFLINE":
          return { phase: "OFFLINE" };
        case "GO_BACK":
          return { phase: "MATCH_SELECT" };
        default:
          return state;
      }

    case "OFFLINE":
      switch (action.type) {
        case "RETRY":
          return { phase: "LOADING" };
        default:
          return state;
      }

    case "API_ERROR":
      switch (action.type) {
        case "RETRY":
          return { phase: "LOADING" };
        case "GO_BACK":
          return { phase: "MATCH_SELECT" };
        default:
          return state;
      }

    default:
      return state;
  }
}

export const INITIAL_APP_STATE: AppState = { phase: "LOADING" };
