declare namespace NodeJS {
  interface ProcessEnv extends Dict<string> {
    /** Current environment the node is running in. */
    readonly NODE_ENV?: NodeEnv;
    readonly DISCORD_TOKEN?: string;
    readonly DISCORD_MAIN_GUILD?: string;
    readonly TEMPORARY_CATEGORY_ID?: string;
    readonly TEMPORARY_ENTRY_CHANNEL_ID?: string;
  }
}

declare type NodeEnv = 'development' | 'production';
