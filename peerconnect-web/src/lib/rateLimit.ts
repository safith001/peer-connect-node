/**
 * ==============================================================================
 * Action Debouncing & Client-Side Rate Limiting Utility (`rateLimit.ts`)
 * ==============================================================================
 * 
 * ARCHITECTURAL CONCEPT: Throttling & Debouncing
 * ----------------------------------------------
 * In full-stack engineering, protecting downstream databases and third-party APIs
 * from high-frequency spam or accidental double-clicks is a core reliability requirement.
 * 
 * 1. COOLDOWN / RATE LIMITING (Token Bucket / Timestamp Window):
 *    Ensures a heavy operation (like publishing a post or sending a message) can only
 *    occur once every N seconds.
 *    Analogy: A subway turnstile that locks for 5 seconds after a card swipe so
 *    two people don't try to squeeze through on one swipe.
 * 
 * 2. DEBOUNCING:
 *    Postpones execution until a specified delay (e.g., 400ms) has elapsed since
 *    the LAST time the function was invoked.
 *    Analogy: An elevator door waiting 5 seconds after the last person walks in
 *    before closing and ascending. If someone else steps in, the 5-second timer resets.
 */

// In-memory registry of action timestamps
const actionTimestamps = new Map<string, number>();

/**
 * Checks whether an action is allowed based on a cooldown window in seconds.
 * 
 * @param actionKey Unique identifier for the action (e.g. `post_create_${uid}`)
 * @param cooldownSeconds Cooldown duration in seconds (e.g. 10s)
 * @returns Object with `allowed` boolean and remaining `waitSeconds`
 */
export function checkActionCooldown(
  actionKey: string,
  cooldownSeconds: number
): { allowed: boolean; waitSeconds: number } {
  const now = Date.now();
  const lastExecution = actionTimestamps.get(actionKey) || 0;
  const elapsedSeconds = (now - lastExecution) / 1000;

  if (elapsedSeconds < cooldownSeconds) {
    const remaining = Math.ceil(cooldownSeconds - elapsedSeconds);
    return {
      allowed: false,
      waitSeconds: remaining,
    };
  }

  return {
    allowed: true,
    waitSeconds: 0,
  };
}

/**
 * Records an action execution timestamp to start the cooldown window.
 * 
 * @param actionKey Unique identifier for the action (e.g. `post_create_${uid}`)
 */
export function recordActionExecution(actionKey: string): void {
  actionTimestamps.set(actionKey, Date.now());
}

/**
 * Creates a debounced function that delays execution until after `waitMs` milliseconds
 * have elapsed since the last time it was invoked.
 * 
 * @param func The callback to execute
 * @param waitMs Delay in milliseconds (e.g. 400ms)
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, waitMs);
  };
}
