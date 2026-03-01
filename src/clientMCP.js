import { getModelContextTools } from './cartTools.js';

/**
 * Registers WebMCP tools with the browser's navigator.modelContext API.
 * Uses the shared cart tool definitions from cartTools.js.
 *
 * @param {{ addToCart: Function, removeFromCart: Function, getCart?: Function }} handlers
 */
export async function registerWebMCPTools({ addToCart, removeFromCart, getCart }) {
  const TOOLS = getModelContextTools({ addToCart, removeFromCart, getCart });
  if (!navigator.modelContext) {
    console.warn(
      'navigator.modelContext not available. Enable the WebMCP flag in Chrome Canary.',
    );
  } else {
    try {
      navigator.modelContext.provideContext({ tools: TOOLS });

      console.log(
        'WebMCP tools registered:',
        TOOLS.map((t) => t.name),
      );
    } catch (err) {
      console.error('Failed to register WebMCP tools:', err);
    }
  }
}

/**
 * Unregisters all WebMCP tools
 */
export function unregisterWebMCPTools() {
  if (navigator.modelContext) {
    try {
      navigator.modelContext.clearContext();
    } catch (err) {
      console.error('Failed to unregister WebMCP tools:', err);
    }
  }
}
