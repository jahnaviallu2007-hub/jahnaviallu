import { useState, useCallback, useRef, useEffect } from "react";
import { streamChat } from "@/lib/stream-chat";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [lockedPrompt, setLockedPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [hasResponse, setHasResponse] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isThinking) return;

    setLockedPrompt(trimmed);
    setPrompt("");
    setResponse("");
    setError("");
    setIsThinking(true);
    setHasResponse(true);

    let accumulated = "";

    try {
      await streamChat({
        messages: [{ role: "user", content: trimmed }],
        onDelta: (chunk) => {
          accumulated += chunk;
          setResponse(accumulated);
        },
        onDone: () => {
          setIsThinking(false);
        },
      });
    } catch (e) {
      console.error(e);
      setIsThinking(false);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }, [prompt, isThinking]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-3xl mx-auto px-6 py-12 select-none">
      {/* Prompt area — top 40% */}
      <div className="flex-[4] flex flex-col justify-end pb-8">
        {lockedPrompt && isThinking ? (
          <p className="text-foreground text-lg font-medium leading-relaxed">{lockedPrompt}</p>
        ) : (
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question. Press Enter."
            rows={1}
            className="w-full bg-transparent text-foreground text-lg font-medium placeholder:text-muted-foreground resize-none outline-none border-b border-transparent focus:border-primary transition-colors leading-relaxed"
            disabled={isThinking}
          />
        )}
      </div>

      {/* Divider — only after response */}
      {hasResponse && <div className="border-t border-border" />}

      {/* Response area — bottom 60% */}
      <div className="flex-[6] pt-8 overflow-y-auto">
        {isThinking && !response && (
          <span className="inline-block w-2.5 h-5 bg-primary cursor-blink" />
        )}

        {response && (
          <p className="font-serif text-ai-text text-base leading-relaxed whitespace-pre-wrap">
            {response}
            {isThinking && (
              <span className="inline-block w-2 h-4 bg-primary cursor-blink ml-0.5 align-middle" />
            )}
          </p>
        )}

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        {!hasResponse && (
          <p className="text-muted-foreground text-sm tracking-wide">Studio Interstice</p>
        )}
      </div>
    </div>
  );
};

export default Index;
