import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { SampleRequestForm } from "@/components/sample-request-form";

export const metadata: Metadata = { title: "材質樣品冊申請", description: "提出皮革材質與加工效果樣品需求；實際內容及申請方式由專人確認。" };
export default function SampleRequestPage(){return <main className="business-page"><PageHero eyebrow="Material Samples" title="材質樣品冊申請" description="想了解皮革材質與加工效果？可送出樣品冊需求；可提供內容及申請方式仍須由專人確認。"/><section className="business-section page-container sample-request-layout"><aside><p className="eyebrow">Before You Start</p><h2>申請不等於核准</h2><p>樣品冊是否收費、運費、申請資格與寄送方式目前尚未確認。本頁不收集完整地址，也不承諾寄送。</p><Link className="text-link" href="/business">← 返回企業合作</Link></aside><SampleRequestForm/></section></main>}
