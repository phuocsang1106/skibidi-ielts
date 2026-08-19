export * from "./provider";
export * from "./schemas";
export * from "./gemini";
export * from "./openrouter-three-stage";
export * from "./openrouter-client";
export * from "./ielts-rubric-2023";

import { gradingProvider } from "./gemini";
export const getGradingProvider = () => gradingProvider;
export const aiProvider = gradingProvider;
export default gradingProvider;
