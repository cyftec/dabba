import { effect, signal } from "@cyftec/maya/signals";

export const resettableSignal = <T extends boolean | number | string>(
  input: T,
  resetTimeInMs: number,
) => {
  const initialValue = input;
  const sig = signal(initialValue);

  effect(() => {
    const sigVal = sig.value;

    if (sigVal !== initialValue) {
      setTimeout(() => (sig.value = initialValue), resetTimeInMs);
    }
  });

  return sig;
};
