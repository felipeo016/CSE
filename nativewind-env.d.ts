/// <reference types="nativewind/types" />

// TypeScript 6 revisa también los imports sin variables, como import '../global.css'.
// Esta declaración le dice que los archivos .css existen (Metro + NativeWind los procesan).
declare module '*.css';
