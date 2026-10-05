import type {
  FeatureName,
  FeatureOutput,
  PrimitiveFeatureError,
  PrimitiveFeatureSuccess,
} from "types";

type MethodType<P, O> = (
  ok: (s: O) => PrimitiveFeatureSuccess<O>,
  fail: <F>(f: F) => PrimitiveFeatureError<F>,
  options: P,
) => Promise<FeatureOutput<O>>;

export type MethodParameters<P, O> = Parameters<MethodType<P, O>>;

export function feature<P, O>(
  featureName: FeatureName,
  method: MethodType<P, O>,
): (options: P) => Promise<FeatureOutput<O>> {
  const ok = <S>(s: S): PrimitiveFeatureSuccess<S> => {
    return {
      success: true,
      feature: featureName,
      out: s,
    };
  };

  const error = <F>(f: F): PrimitiveFeatureError<F> => {
    return {
      success: false,
      feature: featureName,
      out: f,
    };
  };

  return async function (options: P): Promise<FeatureOutput<O>> {
    return await method(ok, error, options);
  };
}
