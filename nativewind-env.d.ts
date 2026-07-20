/// <reference types="nativewind/types" />

// Metro turns the Tailwind entrypoint into a side-effect import; TS needs to be
// told it's a module.
declare module "*.css";
