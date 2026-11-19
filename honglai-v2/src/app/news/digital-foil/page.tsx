import type { Metadata } from "next";
import Link from "next/link";
import { digitalFoil } from "@/data/digital-foil";
import { withBase } from "@/lib/base-path";

export const metadata: Metadata = { title: "數位燙金介紹", description: "數位燙金上線：耐刮不掉色，少量也划算。免開版，論文精裝、作品集一本也能燙。" };

export default function DigitalFoilPage() {
  return <main className="foil-page">
    <section className="section page-container foil-intro">
      <p className="foil-meta"><Link href="/">最新消息</Link> ／ <time dateTime={digitalFoil.date.replaceAll(".", "-")}>{digitalFoil.date}</time></p>
      <p className="eyebrow">Digital Foil Stamping</p>
      <h1>數位燙金</h1>
      <div className="foil-intro-grid">
        <div className="foil-copy">
          <ul className="foil-tags">{digitalFoil.highlights.map((tag) => <li key={tag}>{tag}</li>)}</ul>
          <h2>{digitalFoil.videoTitle}</h2>
          {digitalFoil.paragraphs.map((text) => <p key={text}>{text}</p>)}
        </div>
        <div className="foil-video">
          <video aria-label="數位燙金堅固性測試影片" autoPlay controls loop muted playsInline poster={withBase(digitalFoil.video.poster)} preload="metadata">
            <source src={withBase(digitalFoil.video.src)} type="video/mp4" />
          </video>
        </div>
      </div>

      <div className="foil-compare">
        <h2>燙金方式比較</h2>
        <p>{digitalFoil.comparisonNote}</p>
        <table>
          <thead><tr><th scope="col">比較項目</th><th scope="col">數位燙金</th><th scope="col">鋅版燙金</th></tr></thead>
          <tbody>
            {digitalFoil.comparison.map((row) => <tr key={row.item}>
              <th scope="row">{row.item}</th>
              <td className="foil-digital" data-label="數位燙金">{row.digital}</td>
              <td data-label="鋅版燙金">{row.zinc}</td>
            </tr>)}
          </tbody>
        </table>
      </div>

      <div className="foil-actions">
        <Link className="outline-link" href="/"><span aria-hidden="true">←</span> 回首頁</Link>
        <Link className="button button-primary" href="/services/samples">查看皮革樣品 <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  </main>;
}
