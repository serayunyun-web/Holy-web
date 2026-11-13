"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { askFaqAssistant, AssistantRequestError, type AssistantReply } from "@/lib/faq-assistant-api";

type ChatMessage = { id: number; role: "assistant" | "user"; text: string; reply?: AssistantReply; isError?: boolean };

const INITIAL_MESSAGE: ChatMessage = {
  id: 1,
  role: "assistant",
  text: "您好，我是萊萊！可以問我印製、裝訂、檔案準備與製作流程喔；價格與特殊需求仍會由專人確認。",
};

const ERROR_MESSAGES: Record<string, string> = {
  AI_TIMEOUT: "AI 回答逾時，請稍後重試。",
  INVALID_REQUEST: "問題內容無法送出，請縮短文字後再試。",
  MODEL_UNAVAILABLE: "AI 服務目前暫時無法使用，請先查看常見問題或聯絡我們。",
  NETWORK_ERROR: "目前無法連線，請稍後再試。",
  NOT_CONFIGURED: "此預覽環境尚未完成 AI 服務設定。",
  RATE_LIMITED: "提問次數過多，請稍後再試。",
  SERVICE_UNAVAILABLE: "AI 客服目前暫停服務，請稍後再試。",
  UNAUTHORIZED: "服務驗證失敗。",
};

export function AiFaqAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const nextId = useRef(2);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("ai-chat-open", open);
    if (open) window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => document.documentElement.classList.remove("ai-chat-open");
  }, [open]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setLoading(true);
    setMessages((current) => [...current, { id: nextId.current++, role: "user", text: question }]);
    try {
      const reply = await askFaqAssistant(question);
      setMessages((current) => [...current, { id: nextId.current++, role: "assistant", text: reply.answer, reply }]);
    } catch (error) {
      const code = error instanceof AssistantRequestError ? error.code : "SERVICE_UNAVAILABLE";
      setMessages((current) => [...current, {
        id: nextId.current++, role: "assistant",
        text: ERROR_MESSAGES[code] ?? ERROR_MESSAGES.SERVICE_UNAVAILABLE, isError: true,
      }]);
    } finally {
      setLoading(false);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  return (
    <div className="ai-assistant-shell">
      {open && (
        <section aria-label="萊萊小幫手" className="ai-chat-panel" role="dialog">
          <header className="ai-chat-header">
            <div className="ai-chat-mark" aria-hidden="true"><span /><span /><span /></div>
            <div><strong>萊萊小幫手</strong><small><i aria-hidden="true" /> 線上服務</small></div>
            <button aria-label="關閉萊萊小幫手" className="ai-chat-close" onClick={close} type="button">×</button>
          </header>
          <div aria-live="polite" className="ai-chat-messages" ref={messagesRef}>
            {messages.map((message) => (
              <article className={`ai-chat-message is-${message.role}${message.isError ? " is-error" : ""}`} key={message.id}>
                <p>{message.text}</p>
                {message.reply?.sources.length ? (
                  <details className="ai-chat-sources"><summary>參考 FAQ</summary><ul>
                    {message.reply.sources.map((source) => <li key={source.id}>{source.question}</li>)}
                  </ul></details>
                ) : null}
                {message.reply?.requiresHuman && <small className="ai-human-note">此需求仍需由專人確認。</small>}
              </article>
            ))}
            {loading && <div aria-label="正在整理回答" className="ai-chat-loading" role="status"><span /><span /><span /><small>正在查找正式 FAQ…</small></div>}
          </div>
          <nav aria-label="萊萊小幫手快捷操作" className="ai-chat-shortcuts">
            <Link href="/quote">線上估價</Link><Link href="/faq">常見問題</Link><Link href="/contact">聯絡我們</Link>
          </nav>
          <form className="ai-chat-form" onSubmit={submit}>
            <label className="sr-only" htmlFor="ai-chat-question">輸入想詢問的問題</label>
            <input autoComplete="off" id="ai-chat-question" maxLength={500} onChange={(event) => setInput(event.target.value)} placeholder="例如：檔案需要做出血嗎？" ref={inputRef} value={input} />
            <button aria-label="送出問題" disabled={loading || !input.trim()} type="submit">送出</button>
          </form>
          <p className="ai-chat-disclaimer">回答依網站正式 FAQ 產生；價格、材質可行性及交期以人工確認為準。</p>
        </section>
      )}
      <button aria-expanded={open} aria-label={open ? "關閉萊萊小幫手" : "開啟萊萊小幫手"} className="ai-service-button" onClick={() => setOpen((current) => !current)} ref={launcherRef} type="button">
        <span aria-hidden="true">•••</span><strong>萊萊</strong><small>{open ? "對話中" : "問問題"}</small>
      </button>
    </div>
  );
}
