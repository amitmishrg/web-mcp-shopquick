# WebMCP ShopQuick

A demo e-commerce app that exposes a **shopping cart as tools** via the browser’s [Web Model Context Protocol (WebMCP)](https://github.com/webmachinelearning/webmcp). Use the cart from an **in-page AI chat** (Vercel AI SDK + OpenAI) or from **external AI clients** (e.g. Cursor, MCP) that talk to the page through `navigator.modelContext`.

![ShopQuick](https://img.shields.io/badge/WebMCP-demo-4f46e5)

## What is WebMCP?

[WebMCP](https://github.com/webmachinelearning/webmcp) is a browser API proposal that lets websites **register tools** (name, description, input schema, execute function) with `navigator.modelContext`. AI agents and clients can then discover and call those tools—for example, to control the cart on this page from another app or from the browser’s AI features.

This project shows:

- **In-page chat**: A React chat UI that calls OpenAI with the same cart tools (Vercel AI SDK). You type things like “Add 2 keyboards” or “What’s in my cart?” and the model uses the tools.
- **External clients**: Any client that uses the browser’s model context (e.g. via MCP or Chrome’s WebMCP integration) can call `addToCart`, `removeFromCart`, and `listCart` on this page.
- **Single source of truth**: One shared module (`cartTools.js`) defines the tools in both shapes: for `navigator.modelContext` and for the AI SDK.

## Features

- **ShopQuick storefront**: Product grid, cart sidebar, add/remove and quantity controls.
- **In-page AI chat**: Open the 💬 Chat panel, add your OpenAI API key, and control the cart by natural language (e.g. “Add the webcam and a lamp”, “Remove the USB hub”).
- **WebMCP tool registration**: On load, the app registers `addToCart`, `removeFromCart`, and `listCart` with `navigator.modelContext.provideContext({ tools })` so external AI clients can use the same cart.
- **AI Elements UI**: Chat built with [AI Elements](https://elements.ai-sdk.dev/) (conversation, message, tool blocks, prompt input, suggestions, shimmer).

## Prerequisites

- **Node.js** 18+
- **npm** (or pnpm / yarn)
- For **in-page chat**: an [OpenAI API key](https://platform.openai.com/api-keys) (entered in the chat UI).
- For **external WebMCP**: a browser that supports `navigator.modelContext` (e.g. [Chrome with the WebMCP flag](https://chromestatus.com/feature/5191746952609792), or a polyfill like [@mcp-b/global](https://www.npmjs.com/package/@mcp-b/global)).

## Quick start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/web-mcp.git
cd web-mcp

# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open the app in your browser (e.g. `http://localhost:5173`).

## How to use

### 1. In-page chat (control cart from the app)

1. Click **💬 Chat** in the header.
2. In the chat panel, click the **🔑** icon and enter your **OpenAI API key**. It is stored only in your browser (localStorage).
3. Type or use suggestions, for example:
   - *“What’s in my cart?”* → uses `listCart`
   - *“Add 2 keyboards”* → uses `addToCart(productId: 2, quantity: 2)`
   - *“Add the webcam and a lamp”* → multiple `addToCart` calls
   - *“Remove the USB hub”* → uses `removeFromCart`
4. The model uses the same cart tools; the cart and chat stay in sync. You can also **download** the conversation (Markdown) from the chat header.

### 2. External AI clients (WebMCP / modelContext)

If your environment supports **Web Model Context** (e.g. Chrome with WebMCP, or an MCP client that can talk to the page):

1. Load the ShopQuick app in a tab.
2. The app calls `navigator.modelContext.provideContext({ tools })` on mount with:
   - **addToCart** – `productId` (number), optional `quantity` (default 1)
   - **removeFromCart** – `productId` (number)
   - **listCart** – no args; returns current cart items
3. Your AI client discovers these tools and can call them; execution runs in the page and updates the same cart you see in the UI.

If `navigator.modelContext` is not available, the app logs a console warning and continues to work for in-page chat only.

## Project structure

```
src/
├── App.jsx              # Root: cart state, product grid, cart/chat panels, WebMCP registration
├── main.jsx             # React entry
├── clientMCP.js         # registerWebMCPTools() / unregisterWebMCPTools() → navigator.modelContext
├── cartTools.js         # Single source of truth: getModelContextTools(), getAISDKTools()
├── WebMCPChat.jsx       # In-page chat: AI SDK generateText(), tools, messages, UI
├── index.css            # Tailwind + theme (e.g. shimmer)
├── App.css              # App-specific styles
└── components/
    ├── ai-elements/     # Conversation, Message, Tool, PromptInput, Suggestion, Shimmer, etc.
    └── ui/              # shadcn-style primitives (Button, Input, …)
```

- **cartTools.js**: Defines the three tools once; exports:
  - `getModelContextTools(handlers)` → array for `provideContext({ tools })`
  - `getAISDKTools(handlers)` → object for Vercel AI SDK `generateText({ tools })`
- **clientMCP.js**: Uses `getModelContextTools()` and registers/unregisters with the browser.
- **WebMCPChat.jsx**: Uses `getAISDKTools()` and builds handlers that call into App’s cart (same as those passed to `registerWebMCPTools`).

## Scripts

| Command     | Description                |
|------------|----------------------------|
| `npm run dev`    | Start Vite dev server      |
| `npm run build`  | Production build           |
| `npm run preview`| Preview production build    |
| `npm run lint`   | Run ESLint                 |

## Tech stack

- **React 19** + **Vite 7**
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`) for in-page chat and tool execution
- **AI Elements** + **shadcn/ui** + **Tailwind CSS v4** for the chat UI
- **Zod** for tool input schemas (AI SDK)
- **WebMCP**: `navigator.modelContext` (provideContext / clearContext)

## References

- [Web Model Context Protocol (WebMCP)](https://github.com/webmachinelearning/webmcp) – browser API proposal
- [Chrome WebMCP status](https://chromestatus.com/feature/5191746952609792)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [AI Elements](https://elements.ai-sdk.dev/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)

## License

MIT
