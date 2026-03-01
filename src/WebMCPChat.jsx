import { useState, useEffect, useRef } from 'react';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getAISDKTools } from '@/cartTools';

import {
  Conversation,
  ConversationContent,
  ConversationDownload,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const LS_KEY = 'webmcp_openai_key';

function createModel(apiKey) {
  const openai = createOpenAI({ apiKey });
  return openai('gpt-4o-mini');
}

function buildSystemPrompt(products) {
  const list = products
    .map((p) => `ID ${p.id}: ${p.name} ($${p.price}) ${p.emoji || ''}`)
    .join(', ');
  return `You are ShopQuick's shopping assistant. Control the cart only via tools. Be concise and friendly.
Products: ${list}.
- Use addToCart(productId, quantity) to add items.
- Use removeFromCart(productId) to remove an item.
- Use listCart() to see current cart when the user asks what's in the cart or for a summary.
Always use numeric product IDs. After acting, briefly confirm what you did.`;
}

const SUGGESTIONS = [
  "What's in my cart?",
  'Add 2 keyboards',
  'Add the webcam and a lamp',
  'Remove the USB hub',
  'Add one of everything under $50',
];

export default function WebMCPChat({
  products = [],
  addToCart,
  removeFromCart,
  getCart,
  onClose,
}) {
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(LS_KEY) || '',
  );
  const [keyDraft, setKeyDraft] = useState(
    () => localStorage.getItem(LS_KEY) || '',
  );
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function saveKey() {
    localStorage.setItem(LS_KEY, keyDraft);
    setApiKey(keyDraft);
    setShowKeyInput(false);
    setMessages([]);
    setHistory([]);
  }

  function resetChat() {
    setMessages([]);
    setHistory([]);
  }

  async function sendMessage(text) {
    const trimmed = (text || '').trim();
    if (!trimmed || loading) return;
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    const userMsg = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const updatedHistory = [...history, { role: 'user', content: trimmed }];

    try {
      const tools = getAISDKTools({
        addToCart: (productId, qty = 1) => {
          const product = products.find((p) => p.id === productId);
          if (!product) return { error: `Product ${productId} not found` };
          for (let i = 0; i < (qty ?? 1); i++) addToCart(product);
          return { success: true, product: product.name, qty: qty ?? 1 };
        },
        removeFromCart: (productId) => {
          removeFromCart(productId);
          return { success: true, removedId: productId };
        },
        getCart: () => getCart(),
      });

      const { text: reply, steps } = await generateText({
        model: createModel(apiKey),
        system: buildSystemPrompt(products),
        messages: updatedHistory,
        tools,
        maxSteps: 6,
      });

      const stepMessages = steps.flatMap((step) => {
        const resultsByCallId = new Map();
        (step.toolResults ?? []).forEach((r) => {
          resultsByCallId.set(r.toolCallId, r);
        });
        const out = [];
        (step.toolCalls ?? []).forEach((call) => {
          const result = resultsByCallId.get(call.toolCallId);
          const state = result ? 'output-available' : 'input-available';
          const err =
            result?.type === 'tool-error' ? String(result.error) : null;
          const output =
            result?.type === 'tool-result'
              ? result.output
              : result?.type === 'tool-error'
                ? null
                : (result?.output ?? result?.result ?? null);
          out.push({
            role: 'tool',
            toolName: call.toolName,
            state,
            input: call.args ?? call.input ?? {},
            output,
            errorText: err,
          });
        });
        return out;
      });

      // Show assistant reply; if no model text, use listCart summary when present
      const lastTool =
        stepMessages.length > 0 ? stepMessages[stepMessages.length - 1] : null;
      const listCartOutput =
        lastTool?.toolName === 'listCart' && Array.isArray(lastTool?.output)
          ? lastTool.output
          : null;
      const fallbackCartSummary = listCartOutput
        ? listCartOutput.length === 0
          ? 'Your cart is empty.'
          : 'Your cart has ' +
            listCartOutput.length +
            ' item(s): ' +
            listCartOutput.map((i) => i?.name ?? 'Item').join(', ') +
            '.'
        : null;
      const assistantContent =
        reply && reply.trim()
          ? reply
          : stepMessages.length > 0
            ? fallbackCartSummary || "Here's the result from the cart."
            : null;

      setMessages((prev) => [
        ...prev,
        ...stepMessages,
        ...(assistantContent
          ? [{ role: 'assistant', content: assistantContent }]
          : []),
      ]);
      setHistory([
        ...updatedHistory,
        { role: 'assistant', content: assistantContent || reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'error', content: err.message || String(err) },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit({ text }) {
    const trimmed = (text || '').trim();
    if (trimmed) sendMessage(trimmed);
  }

  return (
    <div className="webmcp-chat flex h-full flex-col bg-background text-foreground">
      {/* Header – generous padding for a clear, interactive feel */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
        <h2 className="truncate text-sm font-semibold tracking-tight">
          Control cart with chat
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-full"
            title={apiKey ? 'API key' : 'Set API key'}
            onClick={() => setShowKeyInput((v) => !v)}
          >
            🔑
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-full"
            title="New chat"
            onClick={resetChat}
          >
            ↺
          </Button>
          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8 rounded-full"
              onClick={onClose}
            >
              ✕
            </Button>
          )}
        </div>
      </header>

      {showKeyInput && (
        <div className="flex shrink-0 gap-2 border-b border-border bg-muted/30 px-5 py-3">
          <Input
            type="password"
            placeholder="OpenAI API key…"
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveKey()}
            className="h-9 flex-1 font-mono text-xs"
          />
          <Button size="sm" onClick={saveKey}>
            Save
          </Button>
        </div>
      )}

      {/* Messages – ai-elements Conversation with download */}
      <Conversation className="min-h-0 flex-1 overflow-hidden">
        <ConversationContent className="gap-8 overflow-y-auto px-5 py-6">
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={<span className="text-3xl">🛒</span>}
              title="Control your cart by chat"
              description={
                apiKey
                  ? 'Try: "Add 2 keyboards", "What\'s in my cart?", "Remove the USB hub"'
                  : 'Click 🔑 and add your OpenAI API key to start.'
              }
              className="px-2 py-12"
            />
          )}

          {messages.map((msg, i) => {
            if (msg.role === 'user')
              return (
                <Message key={i} from="user">
                  <MessageContent>{msg.content}</MessageContent>
                </Message>
              );

            if (msg.role === 'assistant')
              return (
                <Message key={i} from="assistant">
                  <MessageContent>
                    <MessageResponse>{msg.content}</MessageResponse>
                  </MessageContent>
                </Message>
              );

            if (msg.role === 'tool')
              return (
                <Tool key={i} defaultOpen={true}>
                  <ToolHeader
                    type="dynamic-tool"
                    toolName={msg.toolName}
                    state={msg.state}
                  />
                  <ToolContent>
                    <ToolInput input={msg.input} />
                    <ToolOutput output={msg.output} errorText={msg.errorText} />
                  </ToolContent>
                </Tool>
              );

            if (msg.role === 'error')
              return (
                <div
                  key={i}
                  className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive"
                >
                  {msg.content}
                </div>
              );

            return null;
          })}

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2 animate-pulse rounded-full bg-primary"
                aria-hidden
              />
              <Shimmer className="text-sm" duration={1.5}>
                Thinking…
              </Shimmer>
            </div>
          )}
          <div ref={bottomRef} />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Suggestions – ai-elements Suggestion chips */}
      {messages.length === 0 && apiKey && (
        <div className="shrink-0 border-t border-border bg-muted/30 px-5 py-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Try saying
          </p>
          <Suggestions>
            {SUGGESTIONS.map((s) => (
              <Suggestion key={s} suggestion={s} onClick={sendMessage} />
            ))}
          </Suggestions>
        </div>
      )}

      {/* Input – ai-elements PromptInput (chatbot-style rounded pill) */}
      <div className="shrink-0 border-t border-border bg-background px-5 py-4">
        <PromptInput
          onSubmit={handleSubmit}
          className="w-full divide-y-0 rounded-[28px] border border-input shadow-sm"
        >
          <PromptInputTextarea
            placeholder={
              apiKey
                ? 'Ask to add/remove items or list cart…'
                : 'Set API key first (🔑)'
            }
            disabled={!apiKey}
            className="min-h-10 max-h-32 px-5 py-2.5 md:text-base"
          />
          <PromptInputFooter className="min-h-9 justify-end p-2.5">
            <PromptInputSubmit
              disabled={!apiKey || loading}
              status={loading ? 'submitted' : undefined}
              size="icon-sm"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
