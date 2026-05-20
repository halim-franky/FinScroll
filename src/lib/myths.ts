/**
 * Finfluencer myth library.
 *
 * Each entry catalogs a viral financial claim, the archetype peddling
 * it, the science-backed debunk, a single striking statistic, and a
 * citation source. Severity reflects how harmful the advice is.
 */

export type MythCategory = "crypto" | "daytrading" | "passive_income" | "market_timing" | "speculation";
export type Severity = "yikes" | "dangerous" | "scam";

export interface Myth {
  id: string;
  category: MythCategory;
  archetype: string;
  claim: string;
  scienceSays: string;
  keyStat: string;
  source: string;
  severity: Severity;
}

export const CATEGORY_META: Record<MythCategory, { label: string; emoji: string; color: string }> = {
  crypto:         { label: "Crypto Hype",       emoji: "🪙", color: "rose" },
  daytrading:     { label: "Day Trading",       emoji: "📈", color: "orange" },
  passive_income: { label: "Passive Income",    emoji: "💸", color: "yellow" },
  market_timing:  { label: "Market Timing",     emoji: "⏰", color: "violet" },
  speculation:    { label: "Speculation",       emoji: "🎰", color: "red" },
};

export const SEVERITY_META: Record<Severity, { label: string; color: string; bg: string }> = {
  yikes:     { label: "YIKES",     color: "text-yellow-300", bg: "bg-yellow-500/15 border-yellow-500/30" },
  dangerous: { label: "DANGEROUS", color: "text-orange-300", bg: "bg-orange-500/15 border-orange-500/30" },
  scam:      { label: "SCAM ZONE", color: "text-rose-300",   bg: "bg-rose-500/15 border-rose-500/30" },
};

export const MYTHS: readonly Myth[] = [
  // ── Crypto Hype ──────────────────────────────────────────────────────────
  {
    id: "crypto-100x",
    category: "crypto",
    archetype: "The TikTok Crypto Bro",
    claim: "Buy this altcoin before it 100x — guaranteed!",
    scienceSays:
      "<0.1% of altcoins from 2017 retain even half their peak value. \"Guaranteed 100x\" is mathematically impossible without insider manipulation — which is usually exactly what's happening.",
    keyStat: "96% of 2017 ICOs now worth ~$0",
    source: "NBER Working Paper 26021",
    severity: "scam",
  },
  {
    id: "crypto-replace-fiat",
    category: "crypto",
    archetype: "The Bitcoin Maximalist",
    claim: "Crypto will replace fiat — banks are dinosaurs",
    scienceSays:
      "Bitcoin's daily settlement capacity is ~350k transactions vs Visa's ~150M. 99% of crypto value rotates through speculation, not utility. The \"medium of exchange\" narrative collapsed years ago.",
    keyStat: "88% of retail crypto traders lose money",
    source: "Springer — Review of Financial Studies (2024)",
    severity: "yikes",
  },
  {
    id: "defi-20-apy",
    category: "crypto",
    archetype: "The DeFi Yield Farmer",
    claim: "DeFi yields 20% APY — beats any bank",
    scienceSays:
      "Most DeFi yields come from token emissions that dilute value faster than they pay. The vast majority of 20%+ APY protocols collapsed within 18 months — and many were outright Ponzis.",
    keyStat: "73% of DeFi yield farms lose token value faster than they pay yield",
    source: "SEC Investor Alert + Elsevier (2024)",
    severity: "dangerous",
  },
  {
    id: "nft-art-investment",
    category: "crypto",
    archetype: "The Bored Ape Owner",
    claim: "NFTs are the future of art investing",
    scienceSays:
      "95% of NFTs minted in 2021 have a current floor price of zero ETH. The \"art investment\" framing was a marketing layer over a pump-and-dump structure designed to dump on retail late buyers.",
    keyStat: "95% of NFTs now worth ~$0",
    source: "dappGambl Research (2023)",
    severity: "scam",
  },
  {
    id: "crypto-uncorrelated",
    category: "crypto",
    archetype: "The Diversification Bro",
    claim: "Crypto is uncorrelated — diversify with Bitcoin",
    scienceSays:
      "Bitcoin's correlation to the Nasdaq has been >0.8 since 2020. It moves WITH risk-on assets, not against them. When stocks crash, crypto crashes harder.",
    keyStat: "BTC-Nasdaq correlation: 0.84 (2020-2024)",
    source: "Springer — Journal of Risk Management (2024)",
    severity: "yikes",
  },

  // ── Day Trading ──────────────────────────────────────────────────────────
  {
    id: "day-trading-signals",
    category: "daytrading",
    archetype: "The Discord Signal Seller",
    claim: "I made $10k yesterday — copy my signals!",
    scienceSays:
      "Signal sellers cherry-pick winners and hide losers. Independent audits of 50+ signal services find <30% accuracy and negative net returns when including subscription fees.",
    keyStat: "95% of day traders lose money over 3 years",
    source: "Barber & Odean (SEC-cited research)",
    severity: "scam",
  },
  {
    id: "day-trading-fast-wealth",
    category: "daytrading",
    archetype: "The Lambo Influencer",
    claim: "Day trading is the fastest path to wealth",
    scienceSays:
      "Fastest path to broke. The average retail day trader loses 25-50% of capital in year one. Survivorship bias makes the winners loud while the losers quietly disappear.",
    keyStat: "Only 1 in 6,000 day traders beat the S&P 500 over 5 years",
    source: "Barber, Lee, Liu, Odean (2014)",
    severity: "dangerous",
  },
  {
    id: "options-smart-leverage",
    category: "daytrading",
    archetype: "The Wallstreetbets Degenerate",
    claim: "Options trading is just smart leverage",
    scienceSays:
      "Options BUYERS face negative expected value due to theta decay and bid-ask spreads. The math is brutal: time works against you every single day you hold.",
    keyStat: "77% of options contracts expire worthless",
    source: "CBOE Statistics & Elsevier (2023)",
    severity: "dangerous",
  },
  {
    id: "chart-patterns",
    category: "daytrading",
    archetype: "The Chart Pattern Guru",
    claim: "I time the market perfectly with chart patterns",
    scienceSays:
      "Academic studies show technical analysis underperforms buy-and-hold over any horizon >3 years. Pattern recognition in random price data is a known human bias (apophenia).",
    keyStat: "Technical traders lose to the S&P 500 100% of the time over 20 years",
    source: "Lo, Mamaysky, Wang (2000) — NBER",
    severity: "yikes",
  },
  {
    id: "margin-leverage",
    category: "daytrading",
    archetype: "The Margin Maxi",
    claim: "Margin trading is just smart use of capital",
    scienceSays:
      "Margin AMPLIFIES losses faster than gains and adds borrowing costs. Forced liquidations cascade — your broker sells your worst-timed exit at the worst possible price.",
    keyStat: "73% of margin traders go below initial capital within 24 months",
    source: "SEC Margin Risk Disclosure",
    severity: "dangerous",
  },

  // ── Passive Income Grift ────────────────────────────────────────────────
  {
    id: "dropshipping-millionaire",
    category: "passive_income",
    archetype: "The Dropshipping Course Seller",
    claim: "Dropshipping = $100k/month in 6 months",
    scienceSays:
      "90%+ of dropshipping stores fail within 90 days. The \"millionaire dropshippers\" usually make their money selling COURSES about dropshipping, not running stores.",
    keyStat: "<10% of dropshipping stores generate any profit",
    source: "Shopify Internal Report (2023)",
    severity: "scam",
  },
  {
    id: "pod-passive",
    category: "passive_income",
    archetype: "The Etsy Hustle Bro",
    claim: "Print-on-demand passive income while you sleep",
    scienceSays:
      "Real numbers show <2% of POD sellers earn over $1,000/month. Saturated marketplace + zero pricing power + race-to-the-bottom = paper-thin margins.",
    keyStat: "Median POD seller earns $30/month",
    source: "Printful Seller Survey (2023)",
    severity: "yikes",
  },
  {
    id: "fba-course",
    category: "passive_income",
    archetype: "The Amazon FBA \"Mentor\"",
    claim: "Buy my $997 Amazon FBA course",
    scienceSays:
      "The course-selling business IS the business. Most \"FBA millionaires\" make 90%+ of their income teaching others to do FBA — not from actual FBA sales.",
    keyStat: "67% of Amazon FBA sellers earn under $1,000/month",
    source: "JungleScout State of Seller Report",
    severity: "scam",
  },
  {
    id: "real-estate-no-risk",
    category: "passive_income",
    archetype: "The Real Estate Guru",
    claim: "Real estate has no risk — prices only go up",
    scienceSays:
      "2008 happened. 2022 happened. Real estate is illiquid AND volatile. 1 in 4 homeowners who bought 2005-2007 went underwater. Recovery took 5-13 years depending on the city.",
    keyStat: "-27% peak-to-trough US housing 2007-2012",
    source: "Case-Shiller Index",
    severity: "dangerous",
  },
  {
    id: "affiliate-forever",
    category: "passive_income",
    archetype: "The Affiliate Marketing Influencer",
    claim: "Affiliate marketing — passive income forever",
    scienceSays:
      "Affiliate commissions get cut whenever a publisher gets big. Networks renegotiate down. Sustainable affiliate income requires constant content production — that's not passive.",
    keyStat: "80% of affiliate revenue goes to the top 1% of publishers",
    source: "Affiliate Insider 2023 Report",
    severity: "yikes",
  },

  // ── Market Timing ────────────────────────────────────────────────────────
  {
    id: "called-the-top",
    category: "market_timing",
    archetype: "The Permabear",
    claim: "I called the top — sell everything!",
    scienceSays:
      "Permabears are right approximately once every 7 years. Missing the top 10 trading days of a decade cuts your returns by 50%+. You will never reliably time them.",
    keyStat: "Missing top 10 days = -56% returns over 30 years",
    source: "JPMorgan Guide to Markets",
    severity: "yikes",
  },
  {
    id: "buy-the-dip",
    category: "market_timing",
    archetype: "The Dip Buyer",
    claim: "Just buy the dip — easy money",
    scienceSays:
      "\"Dip\" implies short-term decline. But 2008 dipped 50%. 2000 dipped 78% in tech. You can't tell during the fall whether it's a dip or a crash.",
    keyStat: "Nasdaq took 13 years to recover from the 2000 dot-com crash",
    source: "Yale Endowment Studies",
    severity: "yikes",
  },
  {
    id: "recession-cash",
    category: "market_timing",
    archetype: "The Doom YouTuber",
    claim: "Recession is coming — go to cash",
    scienceSays:
      "Cash loses 3-5% per year to inflation. Sitting out one year of returns costs more than most predicted recessions actually cost — even if the recession arrives.",
    keyStat: "8 of 12 recent \"imminent recession\" calls were wrong",
    source: "Federal Reserve Bank of St. Louis",
    severity: "dangerous",
  },
  {
    id: "macro-timing",
    category: "market_timing",
    archetype: "The Macro Twitter Pundit",
    claim: "I time the market with macro indicators",
    scienceSays:
      "Wall Street's top economists collectively predicted 22 of the last 9 recessions. Forward economic predictions have ~50% accuracy across major firms (coin flip).",
    keyStat: "Economist consensus beats coin flip by 3%",
    source: "Philadelphia Fed Survey of Professional Forecasters",
    severity: "yikes",
  },

  // ── Speculation ──────────────────────────────────────────────────────────
  {
    id: "meme-stocks",
    category: "speculation",
    archetype: "The Diamond Hands Apostle",
    claim: "Meme stocks > index funds",
    scienceSays:
      "99% of meme stock holders bought late, sold lower. GME, AMC, BBBY all -90% from peaks. Index funds: +50%+ since the same period.",
    keyStat: "Avg meme stock holder: -71% from peak entry",
    source: "SEC Robinhood Trading Data (2022)",
    severity: "dangerous",
  },
  {
    id: "leverage-smart",
    category: "speculation",
    archetype: "The 100x Crypto Trader",
    claim: "Leverage = smart use of capital",
    scienceSays:
      "Leverage doesn't change EXPECTED return — it only amplifies volatility AND adds borrowing costs. Forced liquidations always benefit the broker, never the trader.",
    keyStat: "Leveraged retail accounts: 89% loss rate",
    source: "SEC Margin Statistics",
    severity: "dangerous",
  },
  {
    id: "penny-stocks",
    category: "speculation",
    archetype: "The Penny Stock Hunter",
    claim: "Penny stocks = next 1000x",
    scienceSays:
      "Penny stocks are penny stocks for a reason. 95% are pump-and-dump schemes where insiders dump on retail \"discoverers\" tipped off via Discord/Telegram groups.",
    keyStat: "95% of penny stock pumps end in 80%+ losses",
    source: "SEC Microcap Stock Risks",
    severity: "scam",
  },
  {
    id: "forex-better",
    category: "speculation",
    archetype: "The Forex Lambo Account",
    claim: "Forex makes more than stocks",
    scienceSays:
      "Retail forex is one of the worst-performing asset classes for retail traders. Spreads + 100x leverage + 24/7 markets + emotional decisions = systematic losses.",
    keyStat: "70-80% of retail forex accounts close in <12 months",
    source: "NFA Quarterly Reports",
    severity: "dangerous",
  },
  {
    id: "diversification-poor",
    category: "speculation",
    archetype: "The Concentrated Bet Bro",
    claim: "Diversification is for the poor",
    scienceSays:
      "Misquoting Warren Buffett — whose 99% of net worth is in ONE company HE controls (Berkshire). His actual quote: \"Diversification is protection against ignorance — and ignorance is the default state.\"",
    keyStat: "92% of concentrated retail bets underperform an index over 10 years",
    source: "Berkshire Hathaway Annual Letter + Vanguard Research",
    severity: "yikes",
  },
] as const;

export function mythsByCategory(category: MythCategory | "all"): readonly Myth[] {
  if (category === "all") return MYTHS;
  return MYTHS.filter((m) => m.category === category);
}
