const COUNTRY_CODES: Record<string, string> = {
  Argentina: "AR", Australia: "AU", Austria: "AT", Belgium: "BE", Bolivia: "BO",
  Brazil: "BR", Canada: "CA", Colombia: "CO", Croatia: "HR", Curaçao: "CW",
  Denmark: "DK", Ecuador: "EC", Egypt: "EG", England: "GB-ENG", France: "FR",
  Germany: "DE", Ghana: "GH", Haiti: "HT", Iran: "IR", Italy: "IT", Japan: "JP",
  Jordan: "JO", Korea: "KR", Mexico: "MX", Morocco: "MA", Netherlands: "NL",
  "New Zealand": "NZ", Nigeria: "NG", Norway: "NO", Panama: "PA", Paraguay: "PY",
  Portugal: "PT", Qatar: "QA", "Saudi Arabia": "SA", Scotland: "GB-SCT", Senegal: "SN",
  "South Africa": "ZA", Spain: "ES", Switzerland: "CH", Tunisia: "TN", Uruguay: "UY",
  Uzbekistan: "UZ", USA: "US",
};

export function countryCodeForTeam(team: string): string | undefined {
  return COUNTRY_CODES[team.trim()];
}
