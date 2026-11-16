"use client";

import { useEffect, useState } from "react";
import { businessHours } from "@/data/contact";

type Status = { tone: "open" | "break" | "closed"; text: string };

const toMinutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };

function currentStatus(now: Date): Status {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now).map((p) => [p.type, p.value]));
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  const { open, lunchStart, lunchEnd, close } = businessHours;
  const workday = (businessHours.weekdays as readonly number[]).includes(day);
  if (!workday) return { tone: "closed", text: "今日公休，週一 08:00 開始營業" };
  if (minutes < toMinutes(open)) return { tone: "closed", text: `尚未營業，今天 ${open} 開始營業` };
  if (minutes < toMinutes(lunchStart)) return { tone: "open", text: `營業中，${lunchStart} 午休` };
  if (minutes < toMinutes(lunchEnd)) return { tone: "break", text: `午休中，${lunchEnd} 恢復營業` };
  if (minutes < toMinutes(close)) return { tone: "open", text: `營業中，今天營業到 ${close}` };
  return { tone: "closed", text: day === 5 ? "今日已休息，下週一 08:00 開始營業" : `今日已休息，明天 ${open} 開始營業` };
}

/** 依台灣時間顯示目前營業狀態（不含國定假日判斷）。 */
export function ContactOpenStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  useEffect(() => {
    const update = () => setStatus(currentStatus(new Date()));
    const first = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 60_000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, []);
  if (!status) return <p className="open-status" aria-hidden="true">&nbsp;</p>;
  return <p className={`open-status is-${status.tone}`} aria-live="polite"><i aria-hidden="true" />{status.text}</p>;
}
