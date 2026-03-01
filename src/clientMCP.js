/**
 * Registers WebMCP tools with the browser's navigator.modelContext API.
 * Accepts cart functions from the React component so they can close over
 * the component's state — no separate store or exports needed.
 *
 * @param {{ addToCart: Function, removeFromCart: Function }} handlers
 */
export async function registerWebMCPTools({ addToCart, removeFromCart }) {
  const TOOLS = [
    {
      name: 'addToCart',
      description:
        'Add a product to the shopping cart. Provide the product ID and an optional quantity (defaults to 1).',
      inputSchema: {
        type: 'object',
        properties: {
          productId: {
            type: 'number',
            description: 'The unique product ID to add to the cart',
          },
          quantity: {
            type: 'number',
            description: 'Number of units to add (default: 1)',
          },
        },
        required: ['productId'],
      },
      execute: async (input) => addToCart(input.productId, input.quantity ?? 1),
    },
    {
      name: 'removeFromCart',
      description: 'Remove a product from the shopping cart by product ID.',
      inputSchema: {
        type: 'object',
        properties: {
          productId: {
            type: 'number',
            description: 'The product ID to remove from the cart',
          },
        },
        required: ['productId'],
      },
      execute: async (input) => removeFromCart(input.productId),
    },
  ];
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
