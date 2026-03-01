/**
 * Single source of truth for cart tools.
 * Used by:
 * - clientMCP.js → navigator.modelContext.provideContext({ tools })
 * - WebMCPChat.jsx → generateText({ tools }) (Vercel AI SDK)
 *
 * modelContext does not expose a way to read tools back, so we cannot
 * "get tools from modelContext" and pass them to the SDK. We define them
 * once here and consume in both places.
 *
 * @param {{ addToCart: (productId: number, quantity?: number) => any, removeFromCart: (productId: number) => any, getCart?: () => any }} handlers
 */

import { tool } from 'ai';
import { z } from 'zod';

const ADD_DESCRIPTION =
  'Add a product to the cart. Provide productId (number) and optional quantity (default 1).';
const REMOVE_DESCRIPTION = 'Remove a product from the cart by product ID.';
const LIST_DESCRIPTION =
  'List current cart contents. Use when user asks what is in the cart or for a summary.';

/**
 * Tools in the shape expected by navigator.modelContext.provideContext({ tools }).
 */
export function getModelContextTools({ addToCart, removeFromCart, getCart }) {
  return [
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
      execute: async (input) =>
        addToCart(input.productId, input.quantity ?? 1),
    },
    {
      name: 'removeFromCart',
      description:
        'Remove a product from the shopping cart by product ID.',
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
    ...(typeof getCart === 'function'
      ? [
          {
            name: 'listCart',
            description:
              'List current cart contents. Returns items with id, name, price, and quantity. Use this when the user asks what is in their cart or for a summary.',
            inputSchema: { type: 'object', properties: {} },
            execute: async () => getCart(),
          },
        ]
      : []),
  ];
}

/**
 * Tools in the shape expected by Vercel AI SDK generateText({ tools }).
 */
export function getAISDKTools({ addToCart, removeFromCart, getCart }) {
  return {
    addToCart: tool({
      description: ADD_DESCRIPTION,
      inputSchema: z.object({
        productId: z.number().describe('Product ID'),
        quantity: z.number().optional().default(1),
      }),
      execute: async ({ productId, quantity }) =>
        addToCart(productId, quantity ?? 1),
    }),
    removeFromCart: tool({
      description: REMOVE_DESCRIPTION,
      inputSchema: z.object({
        productId: z.number().describe('Product ID to remove'),
      }),
      execute: async ({ productId }) => removeFromCart(productId),
    }),
    listCart: tool({
      description: LIST_DESCRIPTION,
      inputSchema: z.object({}),
      execute: async () => getCart(),
    }),
  };
}
