import { evaluate } from "mathjs";
import type { FeatureOutput } from "types";

export function calc(options: { expression: string }): FeatureOutput<number> {
  try {
    const result: unknown = evaluate(options.expression);
    if (typeof result != "number" || Number.isNaN(result) || !Number.isFinite(result))
      throw new Error("Invalid result");

    return { success: true, feature: "math/calc", out: result };
  } catch (error) {
    return {
      success: false,
      feature: "math/calc",
      out: {
        title: "Invalid expression.",
        reason: String(error).includes("Invalid result")
          ? `Preferably, provide expressions with a result a computer can manage (expr. \`${options.expression}\` gave a result above compute limit).`
          : "Please provide a valid mathematical expression. Examples: ’sin(pi/4)’, ’10*2+(6/3)’, ’sqrt(25)’",
      },
    };
  }
}
