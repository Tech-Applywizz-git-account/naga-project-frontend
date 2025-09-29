// Type definitions for Deno runtime in Supabase Edge Functions
// This ensures the Deno global object is properly recognized

declare global {
  interface DenoEnv {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    has(key: string): boolean;
    toObject(): Record<string, string>;
  }

  interface DenoInspectOptions {
    showHidden?: boolean;
    depth?: number;
    colors?: boolean;
    showProxy?: boolean;
    maxArrayLength?: number;
    maxStringLength?: number;
    breakLength?: number;
    compact?: boolean | number;
    sorted?: boolean;
    getters?: boolean;
  }

  var Deno: {
    env: DenoEnv;
    inspect(value: unknown, options?: DenoInspectOptions): string;
  };
}

export {};