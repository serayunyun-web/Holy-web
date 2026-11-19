"use client";

import { useEffect, useRef, useState } from "react";

type HandDrawnTitleProps = {
  title: string;
  /** 要手繪圈起來的文字 */
  circle?: string;
  /** 要畫底線的文字 */
  underline?: string;
};

type Segment = { text: string; mark?: "circle" | "underline" };

/** 依 circle / underline 把標題切成一般文字與要標示的片段（找不到的標示會略過）。 */
function splitTitle(title: string, marks: { text?: string; mark: "circle" | "underline" }[]): Segment[] {
  const found = marks
    .flatMap(({ text, mark }) => {
      const start = text ? title.indexOf(text) : -1;
      return text && start >= 0 ? [{ start, end: start + text.length, mark }] : [];
    })
    .sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const { start, end, mark } of found) {
    if (start < cursor) continue;
    if (start > cursor) segments.push({ text: title.slice(cursor, start) });
    segments.push({ text: title.slice(start, end), mark });
    cursor = end;
  }
  if (cursor < title.length) segments.push({ text: title.slice(cursor) });
  return segments;
}

/** 手繪圈重點：進入畫面時先圈重點、再畫底線，停留後線條從起點收掉（只播一次）。 */
export function HandDrawnTitle({ title, circle, underline }: HandDrawnTitleProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [drawn, setDrawn] = useState(false);
  const segments = splitTitle(title, [{ text: circle, mark: "circle" }, { text: underline, mark: "underline" }]);
  const hasMarks = segments.some((segment) => segment.mark);

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasMarks) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setDrawn(true);
        observer.disconnect();
      }
    }, { threshold: 1, rootMargin: "0px 0px -12% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMarks]);

  return (
    <span className={`hand-drawn-title${drawn ? " is-drawn" : ""}`} ref={ref}>
      {segments.map((segment, index) => segment.mark ? (
        <span className={`hand-mark hand-mark-${segment.mark}`} key={index}>
          {segment.text}
          {segment.mark === "circle" ? (
            <svg aria-hidden="true" focusable="false" preserveAspectRatio="none" viewBox="0 0 160 56">
              <path d="M30 9 C64 1 128 2 150 15 C162 24 154 42 122 49 C86 56 26 54 10 40 C0 30 10 14 46 7 C74 2 104 3 124 7" pathLength={1} />
            </svg>
          ) : (
            <svg aria-hidden="true" focusable="false" preserveAspectRatio="none" viewBox="0 0 160 14">
              <path d="M3 9 C40 4 92 12 157 5" pathLength={1} />
            </svg>
          )}
        </span>
      ) : <span key={index}>{segment.text}</span>)}
    </span>
  );
}
