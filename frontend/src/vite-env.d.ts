/// <reference types="vite/client" />

// Déclaration des modules CSS pour TypeScript
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
