"use client";

import Link from "next/link";
import { Fragment, type ReactNode, useMemo, useState } from "react";
import {
  faqCategories,
  visibleFaqCategories,
  visibleFaqEntries,
  type FaqEntry,
} from "@/data/faq";

type AnswerBlock =
  | { type: "heading"; content: string }
  | { type: "paragraph"; content: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] };

function CategoryIcon({ icon }: { icon: string }) {
  const sharedProps = {
    "aria-hidden": true,
    fill: "none",
    height: 28,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
    width: 28,
  };

  if (icon === "calculator") {
    return (
      <svg {...sharedProps}>
        <rect height="19" rx="2" width="16" x="4" y="2.5" />
        <path d="M7.5 6h9v3h-9zM8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01" />
      </svg>
    );
  }

  if (icon === "files") {
    return (
      <svg {...sharedProps}>
        <path d="M14 2.5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2" />
        <path d="M14 2.5v4h4M10 6.5h8l3 3v10a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" />
        <path d="M12 12h5M12 16h5" />
      </svg>
    );
  }

  if (icon === "palette") {
    return (
      <svg {...sharedProps}>
        <path d="M12 3a9 9 0 0 0 0 18h1.4a1.8 1.8 0 0 0 1.25-3.1 1.8 1.8 0 0 1 1.24-3.1H18A3 3 0 0 0 21 12a9 9 0 0 0-9-9Z" />
        <path d="M7.5 10h.01M9.5 6.8h.01M14 6.5h.01M17 9h.01" />
      </svg>
    );
  }

  if (icon === "printer") {
    return (
      <svg {...sharedProps}>
        <path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M7 14h10v7H7zM17 11h.01" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 13H2.5v4A2.5 2.5 0 0 0 5 19.5h1v-7H4M20 13h1.5v4a2.5 2.5 0 0 1-2.5 2.5h-1v-7h2M18 19.5c0 1.1-.9 2-2 2h-3" />
    </svg>
  );
}

function parseAnswer(answer: string): AnswerBlock[] {
  const lines = answer.split("\n");
  const blocks: AnswerBlock[] = [];

  for (let index = 0; index < lines.length; ) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "heading", content: line.slice(4) });
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s/, ""));
        index += 1;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("### ") &&
      !lines[index].trim().startsWith("- ") &&
      !/^\d+\.\s/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", content: paragraph.join(" ") });
  }

  return blocks;
}

function AnswerContent({ answer }: { answer: string }) {
  return parseAnswer(answer).map((block, index) => {
    if (block.type === "heading") {
      return <h4 key={`${block.type}-${index}`}>{block.content}</h4>;
    }
    if (block.type === "unordered-list") {
      return (
        <ul key={`${block.type}-${index}`}>
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      );
    }
    if (block.type === "ordered-list") {
      return (
        <ol key={`${block.type}-${index}`}>
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ol>
      );
    }
    return <p key={`${block.type}-${index}`}>{block.content}</p>;
  });
}

function groupFaqs(entries: FaqEntry[]) {
  const categoryGroups = new Map<string, Map<string, FaqEntry[]>>();

  for (const faq of entries) {
    if (!categoryGroups.has(faq.category)) {
      categoryGroups.set(faq.category, new Map());
    }
    const subcategories = categoryGroups.get(faq.category)!;
    if (!subcategories.has(faq.subcategory)) {
      subcategories.set(faq.subcategory, []);
    }
    subcategories.get(faq.subcategory)!.push(faq);
  }

  return categoryGroups;
}

function QuestionRow({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FaqEntry;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const answerId = `faq-answer-${faq.id}`;

  return (
    <article className={`faq-item${isOpen ? " is-open" : ""}`}>
      <h3>
        <button
          aria-controls={answerId}
          aria-expanded={isOpen}
          className="faq-question"
          onClick={onToggle}
          type="button"
        >
          <span>{faq.question}</span>
          <span aria-hidden="true" className="faq-toggle-mark">+</span>
        </button>
      </h3>
      <div className="faq-answer-shell" hidden={!isOpen} id={answerId}>
        <div className="faq-answer">
          <AnswerContent answer={faq.answer} />
          {faq.priceRelated && (
            <p className="faq-price-guidance">
              價格仍須依實際需求確認，請前往 <Link href="/quote">快速查價</Link> 填寫資料。
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function FaqBrowser() {
  const firstCategory = visibleFaqCategories[0];
  const [selectedCategory, setSelectedCategory] = useState(firstCategory.slug);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIds, setOpenFaqIds] = useState<Set<string>>(new Set());
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("zh-Hant");

  const selectedCategoryData = faqCategories.find(
    (category) => category.slug === selectedCategory,
  ) ?? firstCategory;

  const displayedFaqs = useMemo(() => {
    if (normalizedQuery) {
      return visibleFaqEntries.filter((faq) =>
        `${faq.question}\n${faq.answer}\n${faq.category}\n${faq.subcategory}`
          .toLocaleLowerCase("zh-Hant")
          .includes(normalizedQuery),
      );
    }
    return visibleFaqEntries.filter((faq) => faq.categorySlug === selectedCategory);
  }, [normalizedQuery, selectedCategory]);

  const groupedFaqs = useMemo(() => groupFaqs(displayedFaqs), [displayedFaqs]);
  const currentTitle = normalizedQuery ? "搜尋結果" : selectedCategoryData.name;

  function selectCategory(categorySlug: string) {
    setSelectedCategory(categorySlug);
    setSearchQuery("");
    setOpenFaqIds(new Set());
  }

  function toggleFaq(faqId: string) {
    setOpenFaqIds((current) => {
      const next = new Set(current);
      if (next.has(faqId)) next.delete(faqId);
      else next.add(faqId);
      return next;
    });
  }

  let content: ReactNode;
  if (displayedFaqs.length === 0) {
    content = (
      <div className="faq-empty" role="status">
        <strong>找不到符合的問題</strong>
        <p>可以換一個關鍵字，或前往聯絡頁面留下需求。</p>
        <Link className="text-link" href="/contact">聯絡我們 <span>→</span></Link>
      </div>
    );
  } else {
    content = [...groupedFaqs.entries()].map(([category, subcategories]) => (
      <section className="faq-category-results" key={category}>
        {normalizedQuery && <h2 className="faq-search-category">{category}</h2>}
        {[...subcategories.entries()].map(([subcategory, entries]) => (
          <Fragment key={`${category}-${subcategory}`}>
            <div className="faq-subcategory-heading"><span>{subcategory}</span></div>
            <div className="faq-accordion">
              {entries.map((faq) => (
                <QuestionRow
                  faq={faq}
                  isOpen={openFaqIds.has(faq.id)}
                  key={faq.id}
                  onToggle={() => toggleFaq(faq.id)}
                />
              ))}
            </div>
          </Fragment>
        ))}
      </section>
    ));
  }

  return (
    <main className="faq-page">
      <section className="faq-intro">
        <div className="page-container faq-intro-inner">
          <div>
            <p className="eyebrow">FAQ · 常見問題</p>
            <h1>先找到問題，<span>再安心開始製作。</span></h1>
            <p>依主題瀏覽印刷、檔案與後加工說明；個案規格、價格與售後判定仍由鴻萊人工確認。</p>
          </div>
          <label className="faq-search">
            <span className="faq-search-label">搜尋常見問題</span>
            <span className="faq-search-control">
              <span aria-hidden="true" className="faq-search-icon">⌕</span>
              <input
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="輸入關鍵字，例如：出血、檔案、打樣"
                type="search"
                value={searchQuery}
              />
              {searchQuery && (
                <button aria-label="清除搜尋" onClick={() => setSearchQuery("")} type="button">清除</button>
              )}
            </span>
          </label>
        </div>
      </section>

      <section aria-label="FAQ 分類" className="faq-category-section">
        <div className="page-container">
          <div className="faq-category-list">
            {visibleFaqCategories.map((category) => {
              const isSelected = !normalizedQuery && selectedCategory === category.slug;
              return (
                <button
                  aria-pressed={isSelected}
                  className="faq-category-button"
                  key={category.id}
                  onClick={() => selectCategory(category.slug)}
                  type="button"
                >
                  <span className="faq-category-icon"><CategoryIcon icon={category.icon} /></span>
                  <strong>{category.name}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="faq-results-section">
        <div className="page-container">
          <nav aria-label="麵包屑" className="faq-breadcrumbs">
            <Link href="/">首頁</Link><span aria-hidden="true">/</span>
            <Link href="/faq">常見問題</Link><span aria-hidden="true">/</span>
            <span aria-current="page">{currentTitle}</span>
          </nav>
          <header className="faq-current-heading">
            <p>{normalizedQuery ? `「${searchQuery.trim()}」` : "FAQ CATEGORY"}</p>
            <h2>{currentTitle}</h2>
            {normalizedQuery && <span>共 {displayedFaqs.length} 題</span>}
          </header>
          <div aria-live="polite" className="faq-results">{content}</div>
        </div>
      </section>
    </main>
  );
}
