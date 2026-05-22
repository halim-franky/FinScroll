/**
 * Shared types for the Learn v2 system.
 *
 * The card shape is intentionally rich so we can drive multiple views
 * (Story / Reading / Visualize / Audio) and learning-progression
 * features (spaced repetition, concept connections, mini-series)
 * from a single data source.
 */

export type Level = "Beginner" | "Intermediate" | "Advanced" | "Quant";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SourceCitation {
  name: string;
  url: string;
}

export interface VisualData {
  label: string;
  value: string;
  percent: number;
}

export type AnimationKey =
  | "growth-line"
  | "compounding-bars"
  | "shield"
  | "alert-triangle"
  | "spark";

export interface Card {
  // Identity
  id: string | number;

  // Classification
  level: Level;
  topic: string;
  gradient: string;

  // Story frames content
  emoji: string;
  title: string;
  hook: string;              // 1-line tagline for Frame 1
  keyFact: string;           // Full key fact for Reading mode + audio
  insight: string;           // Short headline for Frame 3
  impactLabel: string;       // Frame 3 label
  impactValue: string;       // Frame 3 hero number

  // Visual
  visualData?: VisualData[];
  animation?: AnimationKey;   // Lottie animation key for Frame 2

  // Personalization template — placeholders {scrollHours}, {struggle}, {goal}
  personalizedTemplates?: Partial<Record<string, string>>;

  // Quiz
  quiz: QuizQuestion;

  // Citation
  source: SourceCitation;

  // Metadata
  creator: string;
  generated?: boolean;

  // Learning graph
  relatedCardIds?: (string | number)[];
  prerequisiteCardIds?: (string | number)[];
  miniSeries?: string;        // mini-series id
}
