export const minerPatterns = [
  // Known miner libraries/functions
  /cryptonight/i,
  /coinhive/i,
  /coin-?hive/i,
  /minero/i,
  /deepMiner/i,
  /coinimp/i,
  /crypto-?loot/i,
  /webminer/i,
  /mineralt/i,

  // Mining pool connections
  /stratum\+tcp:\/\//i,
  /pool\..*\.(com|net|org):\d+/i,
  /xmr\.pool/i,
  /monero.*pool/i,

  // WebAssembly mining patterns
  /cryptonight.*wasm/i,
  /cn-?lite/i,

  // CPU/GPU mining indicators
  /startMining/i,
  /miner\.start/i,
  /CryptoNoter/i,
];

export function checkMinerPatterns(code: string): { matched: boolean; pattern?: string } {
  for (const pattern of minerPatterns) {
    if (pattern.test(code)) {
      return { matched: true, pattern: pattern.source };
    }
  }
  return { matched: false };
}
