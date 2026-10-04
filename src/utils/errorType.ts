import { isModError, ModError } from "embeds/modEmbed";
import { FeatureError, FeatureName, FeatureOutput } from "types";

/**
 * Gives you an error with the Error type.
 * @param value Error with type unknown.
 * @returns Typed error.
 */
export function errorType(value: unknown): Error {
  if (Error.isError(value)) return value;

  try {
    const stringified = JSON.stringify(value);
    return new Error(stringified);
  } catch {
    return value as Error;
  }
}

function exceptionToFeatureError(value: unknown): FeatureError {
  const error = errorType(value);

  return {
    title: "An error occurred.",
    reason: error.message
  }
}

// TODO: make this
// depends on TODO in modEmbed file because i want to move the errorEmbedFrom... function here
// so i need ModActionResult rather than ModError
 function modErrorToFeatureError(value: ModError) : FeatureError{

}

export function errorToFeature(feature: FeatureName, value: unknown) : FeatureOutput<unknown> & { success: false } {
  if (isModError(value)) return {
    success: false,
    feature,
    out: modErrorToFeatureError(value)
  }

  return {
    success: false,
    feature,
    out:exceptionToFeatureError(value)
  }
}
