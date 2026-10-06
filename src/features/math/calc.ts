import { evaluate } from "mathjs";
import type { FeatureOutput } from "types";
import { feature, type MethodParameters } from "utils/feature";

// TODO: actually, forced Promise, this one's not async yet feature() assumes all is async
// have to check
async function method(
  ...parameters: MethodParameters<{ expression: string }, number>
): Promise<FeatureOutput<number>> {
  const [ok, fail, options] = parameters;
  try {
    const result: unknown = evaluate(options.expression);
    if (typeof result != "number" || Number.isNaN(result) || !Number.isFinite(result))
      throw new Error("Invalid result");

    return ok(result);
  } catch (error) {
    return fail({
      title: "Invalid expression.",
      reason: String(error).includes("Invalid result")
        ? `Preferably, provide expressions with a result a computer can manage (expr. \`${options.expression}\` gave a result above compute limit).`
        : "Please provide a valid mathematical expression. Examples: ’sin(pi/4)’, ’10*2+(6/3)’, ’sqrt(25)’",
    });
  }
}

export const calc = feature("math/calc", method);
