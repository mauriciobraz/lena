declare namespace NodeJS {
  interface ProcessEnv extends Dict<string> {
    /** Current environment the node is running in. */
    readonly NODE_ENV?: NodeEnv;
  }
}

declare type NodeEnv = "development" | "production";
