import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-grid">
        <section className="footer-brand"><Image alt="鴻萊興業有限公司｜數位印刷後加工專業廠" className="footer-logo" height={250} src="/honglai-logo.png" style={{ height: "auto" }} width={964} /><p className="footer-copy">提供論文裝訂、證書夾、施工本、菜單及各式客製裝訂服務。正式規格、價格與交期皆由專人確認。</p></section>
        <section><h2 className="footer-title">聯絡資訊</h2><ul className="footer-list"><li>台中市南區有恆街 55 號</li><li>(04) 2471-3063</li><li>週一至週五 08:00–17:30</li></ul></section>
        <section><h2 className="footer-title">快速前往</h2><ul className="footer-list"><li><Link href="/services">服務與產品</Link></li><li><Link href="/quote">快速查價</Link></li><li><Link href="/faq">常見問題</Link></li><li><Link href="/contact">聯絡我們</Link></li></ul></section>
      </div>
      <div className="footer-bottom"><div className="page-container">© 2026 鴻萊興業有限公司｜網站開發預覽，圖片為可替換佔位素材</div></div>
    </footer>
  );
}
