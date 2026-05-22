/**
 * Minimal hand-crafted Lottie animations for the Visual frame.
 *
 * Each animation is bundle-friendly (~1-2KB) and themed by concept type.
 * The point is to give the Visual frame a sense of motion without
 * shipping a heavy Lottie library or generic stock animations.
 *
 * The `pickAnimation` function maps a card to its best-fitting animation.
 */

export type AnimationKey =
  | "growth-line"
  | "compounding-bars"
  | "shield"
  | "alert-triangle"
  | "spark";

// ── Growth line: a line slowly rising and accelerating ─────────────
const growthLine = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 120,
  w: 400,
  h: 300,
  nm: "growth-line",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "line",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [200, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ind: 0,
              ty: "sh",
              ix: 1,
              ks: {
                a: 1,
                k: [
                  {
                    i: { x: 0.42, y: 1 },
                    o: { x: 0.58, y: 0 },
                    t: 0,
                    s: [
                      { i: [[0, 0]], o: [[0, 0]], v: [[-150, 50]], c: false },
                    ],
                  },
                  {
                    t: 90,
                    s: [
                      {
                        i: [
                          [0, 0],
                          [0, 0],
                          [0, 0],
                          [0, 0],
                        ],
                        o: [
                          [0, 0],
                          [0, 0],
                          [0, 0],
                          [0, 0],
                        ],
                        v: [
                          [-150, 50],
                          [-50, 30],
                          [50, -10],
                          [150, -80],
                        ],
                        c: false,
                      },
                    ],
                  },
                ],
              },
              nm: "Path",
            },
            {
              ty: "st",
              c: { a: 0, k: [0.063, 0.725, 0.506, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 12 },
              lc: 2,
              lj: 2,
              nm: "stroke",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
          nm: "Group",
        },
      ],
      ip: 0,
      op: 120,
      st: 0,
      bm: 0,
    },
  ],
  markers: [],
};

// ── Compounding bars: ascending bar chart ──────────────────────────
const compoundingBars = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 120,
  w: 400,
  h: 300,
  nm: "compounding-bars",
  ddd: 0,
  assets: [],
  layers: [1, 2, 3, 4, 5].map((bar, i) => ({
    ddd: 0,
    ind: i + 1,
    ty: 4,
    nm: `bar${bar}`,
    sr: 1,
    ks: {
      o: {
        a: 1,
        k: [
          { t: i * 10, s: [0] },
          { t: i * 10 + 15, s: [100] },
        ],
      },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [80 + bar * 50, 250, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 1,
        k: [
          { t: i * 10, s: [100, 0, 100] },
          { t: i * 10 + 25, s: [100, 100 * Math.pow(1.5, i), 100] },
        ],
      },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "rc",
            d: 1,
            s: { a: 0, k: [30, 1] },
            p: { a: 0, k: [0, -0.5] },
            r: { a: 0, k: 4 },
            nm: "Rect",
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.063, 0.725, 0.506, 1] },
            o: { a: 0, k: 100 },
            nm: "fill",
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
    ],
    ip: 0,
    op: 120,
    st: 0,
    bm: 0,
  })),
  markers: [],
};

// ── Shield: pulsing safety icon ────────────────────────────────────
const shield = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 90,
  w: 400,
  h: 300,
  nm: "shield",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "shield",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [200, 150, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: 0.42, y: 1 }, o: { x: 0.58, y: 0 }, t: 0, s: [80, 80, 100] },
            { i: { x: 0.42, y: 1 }, o: { x: 0.58, y: 0 }, t: 45, s: [110, 110, 100] },
            { t: 90, s: [80, 80, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
                  v: [
                    [0, -90],
                    [60, -60],
                    [60, 30],
                    [0, 90],
                    [-60, 30],
                    [-60, -60],
                  ],
                  c: true,
                },
              },
              nm: "path",
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.063, 0.725, 0.506, 0.85] },
              o: { a: 0, k: 100 },
              nm: "fill",
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
            },
          ],
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
  ],
  markers: [],
};

// ── Alert triangle: warning pulse for risk topics ──────────────────
const alertTriangle = {
  ...shield,
  nm: "alert-triangle",
  layers: shield.layers.map((l) => ({
    ...l,
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "sh",
            ks: {
              a: 0,
              k: {
                i: [[0, 0], [0, 0], [0, 0]],
                o: [[0, 0], [0, 0], [0, 0]],
                v: [[0, -90], [80, 60], [-80, 60]],
                c: true,
              },
            },
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.984, 0.451, 0.451, 0.85] },
            o: { a: 0, k: 100 },
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
    ],
  })),
};

// ── Spark: orbiting dots, hints at sophistication / quant topics ───
const spark = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 120,
  w: 400,
  h: 300,
  nm: "spark",
  ddd: 0,
  assets: [],
  layers: [0, 1, 2, 3].map((i) => ({
    ddd: 0,
    ind: i + 1,
    ty: 4,
    nm: `dot${i}`,
    sr: 1,
    ks: {
      o: { a: 0, k: 80 },
      r: {
        a: 1,
        k: [
          { t: 0, s: [i * 90] },
          { t: 120, s: [i * 90 + 360] },
        ],
      },
      p: { a: 0, k: [200, 150, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] },
    },
    ao: 0,
    shapes: [
      {
        ty: "gr",
        it: [
          {
            ty: "el",
            d: 1,
            s: { a: 0, k: [20, 20] },
            p: { a: 0, k: [0, -80] },
            nm: "ellipse",
          },
          {
            ty: "fl",
            c: { a: 0, k: [0.984, 0.749, 0.141, 1] },
            o: { a: 0, k: 100 },
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
            r: { a: 0, k: 0 },
            o: { a: 0, k: 100 },
          },
        ],
      },
    ],
    ip: 0,
    op: 120,
    st: 0,
    bm: 0,
  })),
  markers: [],
};

export const ANIMATIONS: Record<AnimationKey, object> = {
  "growth-line": growthLine,
  "compounding-bars": compoundingBars,
  shield,
  "alert-triangle": alertTriangle,
  spark,
};

// ── Pick the right animation for a given card topic ────────────────
export function pickAnimation(
  topic: string,
  level: string
): AnimationKey {
  const t = topic.toLowerCase();
  if (level === "Quant") return "spark";
  if (t.includes("risk") || t.includes("danger") || t.includes("speculation") || t.includes("inflation")) {
    return "alert-triangle";
  }
  if (t.includes("emergency") || t.includes("insurance") || t.includes("safety")) {
    return "shield";
  }
  if (t.includes("compound") || t.includes("compounding") || t.includes("invest")) {
    return "compounding-bars";
  }
  return "growth-line";
}
