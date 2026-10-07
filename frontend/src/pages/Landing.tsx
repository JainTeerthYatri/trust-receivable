import { ArrowRight, BadgeCheck, Link2, QrCode, ScanSearch, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-mint-500 font-display text-ink-950">T</div>
          <div>
            <p className="text-sm font-semibold tracking-wide">TRUSTRECEIVABLE</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-mint-400">Verification layer</p>
          </div>
        </div>
        <nav className="hidden gap-6 text-sm text-slate-300 md:flex">
          <a href="#problem">Problem</a>
          <a href="#how">How it works</a>
          <a href="#trust">Architecture</a>
        </nav>
        <div className="flex gap-3">
          <Link to="/verify/TR-INV1045" className="hidden rounded-full border border-white/15 px-4 py-2 text-sm md:inline">Verify an invoice</Link>
          <Link to="/login" className="rounded-full bg-mint-500 px-4 py-2 text-sm font-semibold text-ink-950">Get started</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-10 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.22em] text-mint-400">For MSMEs, buyers and working-capital partners</p>
          <h1 className="font-display text-5xl leading-tight md:text-6xl">Trust every receivable.</h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Turn genuine MSME invoices into verified, transparent and finance-ready digital assets — without replacing UPI, TReDS, GSTN, banks or NBFCs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink-950">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="rounded-full border border-white/20 px-5 py-3 text-sm">Open demo workspace</Link>
          </div>
          <p className="mt-6 max-w-lg text-xs leading-relaxed text-slate-400">
            Technology prototype. Not a bank, NBFC, lender, credit bureau, GST authority or government platform. Receivable Trust Score is not a regulated credit score.
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-ink-800 to-ink-900 p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.2em] text-mint-400">Receivable Passport</p>
          <h2 className="mt-2 font-display text-3xl">INV-1045</h2>
          <p className="text-slate-400">₹10,00,000 · ABC Manufacturing → XYZ Industries</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {[
              ["Invoice verified", "Yes"],
              ["Buyer accepted", "Yes"],
              ["Delivery verified", "Yes"],
              ["Duplicate check", "Clear"],
              ["Blockchain proof", "Verified"],
              ["Trust score", "93 / 100"]
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{k}</p>
                <p className="mt-1 font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="problem" className="border-y border-white/10 bg-ink-900/70 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl">MSMEs wait. Financing waits longer.</h2>
            <p className="mt-4 text-slate-300">The bottleneck is not only payment. Capital providers need to know whether an invoice is genuine, unique, accepted, delivered and still unpaid.</p>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            {["Is the invoice genuine?", "Was it already financed?", "Did the buyer accept it?", "Was delivery confirmed?", "Is it disputed?"].map((q) => (
              <li key={q} className="rounded-2xl border border-white/10 px-4 py-3">{q}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-3xl">How TrustReceivable works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-6">
          {["Create invoice", "Verify", "Buyer accepts", "Blockchain proof", "AI risk analysis", "Financing decision"].map((s, i) => (
            <div key={s} className="rounded-2xl bg-white/5 p-4">
              <p className="text-mint-400">0{i + 1}</p>
              <p className="mt-2 text-sm font-medium">{s}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Flow title="Traditional invoice" steps={["Invoice PDF", "Trust manually", "Multiple checks", "Slow financing"]} />
          <Flow title="TrustReceivable" accent steps={["Invoice", "Verification", "Blockchain proof", "Buyer + delivery proof", "AI risk intelligence", "Receivable Passport", "Faster decision"]} />
        </div>
      </section>

      <section className="bg-white py-16 text-ink-900">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          <Feature icon={Shield} title="Blockchain verification" body="Only cryptographic fingerprints and state transitions go on-chain. Documents stay off-chain." />
          <Feature icon={Sparkles} title="AI risk intelligence" body="Transparent Receivable Trust Score with reasons — not a bureau credit score." />
          <Feature icon={BadgeCheck} title="Receivable Passport" body="A single, auditable view of verification, disputes, financing and payment history." />
          <Feature icon={ScanSearch} title="Duplicate detection" body="Catch reused invoice numbers, identical hashes and overlapping commercial terms." />
          <Feature icon={QrCode} title="QR verification" body="Anyone can open a public verification page with safe, non-sensitive status." />
          <Feature icon={Link2} title="Financing workflow" body="MSME requests, financier inspects the passport, then records an approve/reject decision." />
        </div>
      </section>

      <section id="trust" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-3xl">Trust architecture</h2>
        <p className="mt-3 max-w-2xl text-slate-300">Off-chain commercial data → canonical JSON → SHA-256 fingerprint → EVM registry → AI scoring → passport.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {["Off-chain data in MongoDB", "Cryptographic proof", "Blockchain state machine", "Explainable AI score"].map((t) => (
            <div key={t} className="rounded-2xl border border-white/10 p-5 text-sm">{t}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: typeof Shield; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-sand-100 p-5 shadow-sm">
      <Icon className="h-5 w-5 text-mint-600" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function Flow({ title, steps, accent }: { title: string; steps: string[]; accent?: boolean }) {
  return (
    <div className={`rounded-3xl p-6 ${accent ? "bg-mint-500 text-ink-950" : "bg-white/5"}`}>
      <h3 className="font-display text-2xl">{title}</h3>
      <ol className="mt-4 space-y-2 text-sm">
        {steps.map((s) => (
          <li key={s}>↓ {s}</li>
        ))}
      </ol>
    </div>
  );
}
