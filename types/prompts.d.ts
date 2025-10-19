export type PromptType = "text" | "number" | "toggle" | "list" | "select" | "multiselect";

export interface Choice<T = unknown> {
  title: string;
  value: T;
  description?: string;
}

export interface PromptObject<TName extends string = string> {
  type?: PromptType | ((prev: unknown, values: Record<string, unknown>) => PromptType | null);
  name: TName;
  message?: string;
  initial?: unknown;
  choices?: Choice[];
  separator?: string;
  active?: string;
  inactive?: string;
  validate?: (value: unknown) => boolean | string;
}

export interface PromptOptions {
  onCancel?: () => void;
  onSubmit?: (prompt: PromptObject, answer: unknown) => void;
}

export type Answers<T extends Record<string, unknown> = Record<string, unknown>> = T;

export default function prompts<T extends Record<string, unknown> = Record<string, unknown>>(
  questions: PromptObject | PromptObject[],
  options?: PromptOptions
): Promise<Answers<T>>;

export { PromptObject, PromptOptions, Choice, Answers };
