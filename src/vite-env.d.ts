/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GA_MEASUREMENT_ID?: string;
    readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
    readonly VITE_TEASER_LAUNCH_AT?: string;
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
