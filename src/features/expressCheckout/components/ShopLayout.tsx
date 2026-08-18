import { Link } from "react-router-dom";
import ConfigSheet from "@/features/expressCheckout/components/ConfigSheet";

export default function ShopLayout({ env, children }: { env: string; children: React.ReactNode }) {
  return (
    <div data-flow="express" className="min-h-screen w-screen -mx-[calc(50vw-50%)]" style={{ background: "var(--paper)" }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-8">
          <Link to={`/express/${env}/shelf`} className="text-2xl" style={{ fontFamily: "var(--font-serif)", color: "var(--ink)" }}>
            Page Turner
          </Link>
          <span className="text-[12px]" style={{ color: "var(--ink-faint)" }}>Good reads, fast · {env}</span>
        </header>
        {children}
      </div>
      <ConfigSheet />
    </div>
  );
}
