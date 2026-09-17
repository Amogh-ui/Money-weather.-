"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CircleDollarSign,
  CreditCard, Gauge, Home, Pause, QrCode, ReceiptText, ShieldCheck, SlidersHorizontal,
  WalletCards, X,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

type Condition = "Stable" | "Tightening" | "Under Pressure";
type RouteChoice = "slow" | "adjust" | "none" | null;
type RecommendationView = "detail" | "compare" | "review" | "confirmed" | null;

const SALARY = 60000;
const SAVINGS = 12000;
const BASE_SPENT = 4800;
const WEEK_PROGRESS = 57;
const PRODUCT_AMOUNT = 2000;

const inr = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

function Atmosphere({ condition, compact = false }: { condition: Condition; compact?: boolean }) {
  const density = condition === "Stable" ? 7 : condition === "Tightening" ? 10 : 13;
  return (
    <div className={`atmosphere ${compact ? "atmosphere-compact" : ""} ${condition.toLowerCase().replace(" ", "-")}`} aria-hidden="true">
      <div className="atmosphere-glow" />
      <svg viewBox="0 0 390 220" preserveAspectRatio="none">
        {Array.from({ length: density }, (_, index) => {
          const spread = condition === "Stable" ? 20 : condition === "Tightening" ? 13 : 8;
          const y = 40 + index * spread;
          return <path key={index} d={`M-12 ${y} C 62 ${y - 15}, 112 ${y + 15}, 188 ${y - 3} S 312 ${y + 9}, 410 ${y - 12}`} />;
        })}
      </svg>
    </div>
  );
}

function PaceTrack({ spent, boundary, mini = false }: { spent: number; boundary: number; mini?: boolean }) {
  const used = Math.round((spent / boundary) * 100);
  return (
    <div className={`pace-track ${mini ? "pace-mini" : ""}`} aria-label={`${used}% of UPI boundary used; ${WEEK_PROGRESS}% of week completed`}>
      {!mini && <div className="track-top"><span>UPI pace</span><span>{3} days left</span></div>}
      <div className="track-rail">
        <div className="track-ticks">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div>
        <div className="spend-line" style={{ width: `${Math.min(used, 100)}%` }} />
        <span className="time-marker" style={{ left: `${WEEK_PROGRESS}%` }}><b>Week</b></span>
        <span className="spend-marker" style={{ left: `${Math.min(used, 100)}%` }}><b>UPI</b></span>
      </div>
      {!mini && (
        <div className="track-stats">
          <span><b>{WEEK_PROGRESS}%</b> of week</span>
          <span><b>{used}%</b> of {inr(boundary)}</span>
        </div>
      )}
    </div>
  );
}

function TopBar({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <header className="topbar">
      {onBack ? <button className="icon-button" onClick={onBack} aria-label="Go back"><ArrowLeft size={19} /></button> : <span className="topbar-spacer" />}
      <span className="topbar-title">{title}</span>
      <span className="topbar-spacer" />
    </header>
  );
}

function BottomNav({ active, onNavigate }: { active: "home" | "activity" | "plan"; onNavigate: (where: "home" | "activity" | "plan") => void }) {
  const items = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "activity" as const, label: "Activity", icon: ReceiptText },
    { id: "plan" as const, label: "Plan", icon: SlidersHorizontal },
  ];
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map(({ id, label, icon: Icon }) => (
        <button key={id} className={active === id ? "active" : ""} onClick={() => onNavigate(id)} aria-label={label} aria-current={active === id ? "page" : undefined}>
          <Icon size={20} />
        </button>
      ))}
    </nav>
  );
}

function ScreenFrame({ children, nav, onNavigate }: { children: ReactNode; nav?: "home" | "activity" | "plan"; onNavigate: (where: "home" | "activity" | "plan") => void }) {
  return <div className={`screen ${nav ? "with-nav" : ""}`}>{children}{nav && <BottomNav active={nav} onNavigate={onNavigate} />}</div>;
}

function BrandMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.7)} viewBox="0 0 100 70" fill="none" aria-hidden="true">
      <path d="M8 62 L30 8 L50 45 L70 8 L92 62" stroke="currentColor" strokeWidth={16} strokeLinejoin="miter" strokeLinecap="butt" strokeMiterlimit={20} />
    </svg>
  );
}

export default function HomePage() {
  const [screen, setScreen] = useState(0);
  const [rent, setRent] = useState(16000);
  const [planned, setPlanned] = useState(5000);
  const [other, setOther] = useState(3000);
  const [boundary, setBoundary] = useState(6000);
  const [feedback, setFeedback] = useState<number[]>([]);
  const [paymentDone, setPaymentDone] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [choice, setChoice] = useState<RouteChoice>(null);
  const [reviewChoice, setReviewChoice] = useState<"keep" | "adjust" | "pause">("keep");
  const [recommendationView, setRecommendationView] = useState<RecommendationView>(null);
  const [recommendationDismissed, setRecommendationDismissed] = useState(false);
  const [creditActivated, setCreditActivated] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanFound, setScanFound] = useState(false);

  const commitments = rent + planned + other;
  const safeToUse = Math.max(0, SALARY - SAVINGS - commitments);
  const availableBeforeProduct = Math.max(0, safeToUse - (choice === "adjust" ? Math.max(boundary - 6000, 0) : 0));
  const availableSafe = availableBeforeProduct + (creditActivated ? PRODUCT_AMOUNT : 0);
  const spent = BASE_SPENT + (paymentDone ? 320 : 0);
  const usedPercent = Math.round((spent / boundary) * 100);
  const condition: Condition = usedPercent <= WEEK_PROGRESS + 8 ? "Stable" : usedPercent <= 100 ? "Tightening" : "Under Pressure";
  const productRelevant = condition === "Tightening" && !recommendationDismissed && !creditActivated;
  const productRemainingSafe = availableBeforeProduct + PRODUCT_AMOUNT;

  const navTo = (where: "home" | "activity" | "plan") => setScreen(where === "home" ? 3 : where === "activity" ? 5 : 1);
  const goHome = () => setScreen(3);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: "set_upi_boundary",
        title: "Set UPI boundary",
        description: "Set the weekly UPI boundary in rupees and update the visible pace track.",
        inputSchema: { type: "object", properties: { amount: { type: "number", minimum: 3000, maximum: 12000, multipleOf: 500 } }, required: ["amount"], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input: unknown) {
          const amount = Number((input as { amount?: number })?.amount);
          if (!Number.isFinite(amount) || amount < 3000 || amount > 12000 || amount % 500 !== 0) throw new Error("Amount must be between ₹3,000 and ₹12,000 in ₹500 steps.");
          setBoundary(amount); setScreen(3);
          return { boundary: amount, spent, usedPercent: Math.round((spent / amount) * 100) };
        },
      }, { signal: lifecycle.signal })).catch(() => undefined);
    } catch { /* unsupported preview context */ }
    return () => lifecycle.abort();
  }, [spent]);

  useEffect(() => {
    if (!scanning) return;
    const found = setTimeout(() => setScanFound(true), 1300);
    const complete = setTimeout(() => {
      setScanning(false);
      setScanFound(false);
      setPaymentDone(true);
      setSheetOpen(true);
    }, 1900);
    return () => { clearTimeout(found); clearTimeout(complete); };
  }, [scanning]);

  const screens = useMemo(() => [
    <ScreenFrame key="salary" onNavigate={navTo}>
      <div className="salary-screen">
        <header className="brand-row"><div className="brand-mark"><BrandMark size={16} /></div><span>Money Weather</span></header>
        <div className="salary-copy"><p className="eyebrow">Your first salary is here.</p><h1>₹60,000</h1><div className="salary-meta"><span>Aster Labs</span><span>17 Sep 2026</span></div></div>
        <div className="opening-atmosphere"><Atmosphere condition="Stable" /><span className="section-kicker">Financial horizon <i /> Calm</span></div>
        <div className="arrival-note"><span className="note-index">01</span><p>We’ll separate what you can use from money that’s already spoken for.</p></div>
        <div className="screen-actions"><button className="primary-button" onClick={() => setScreen(1)}>Plan this salary <ArrowRight size={18} /></button><button className="text-button" onClick={() => setScreen(3)}>Not now</button></div>
      </div>
    </ScreenFrame>,

    <ScreenFrame key="commitments" onNavigate={navTo}>
      <TopBar title="Plan this salary" onBack={() => setScreen(0)} />
      <div className="screen-scroll setup-content">
        <div className="section-intro"><p className="eyebrow">₹60,000 received</p><h2>Give every rupee<br />a little context.</h2></div>
        <div className="allocation" aria-label="Salary allocation">
          <div className="allocation-bar"><span style={{ width: `${(commitments / SALARY) * 100}%` }} /><span style={{ width: `${(SAVINGS / SALARY) * 100}%` }} /><span className="safe" style={{ width: `${(safeToUse / SALARY) * 100}%` }} /></div>
          <div className="allocation-legend"><div><i />Commitments<b>{inr(commitments)}</b></div><div><i />Savings<b>{inr(SAVINGS)}</b></div><div className="selected"><i />Safe to use<b>{inr(safeToUse)}</b></div></div>
        </div>
        <Accordion type="single" collapsible defaultValue="commitments" className="dark-accordion">
          <AccordionItem value="commitments"><AccordionTrigger>Upcoming commitments <span className="accordion-amount">{inr(commitments)}</span></AccordionTrigger><AccordionContent>
            {[{ label: "Rent & utilities", value: rent, set: setRent }, { label: "Planned payments", value: planned, set: setPlanned }, { label: "Other upcoming", value: other, set: setOther }].map((item) => (
              <label className="money-input" key={item.label}><span>{item.label}</span><span>₹ <input inputMode="numeric" value={item.value} onChange={(e) => item.set(Math.max(0, Number(e.target.value) || 0))} /></span></label>
            ))}
          </AccordionContent></AccordionItem>
        </Accordion>
        <div className="definition"><ShieldCheck size={17} /><p><b>Safe to use</b> is what remains after the money you chose to protect and the payments you expect.</p></div>
      </div>
      <div className="sticky-action"><button className="primary-button" onClick={() => setScreen(2)}>Continue <ArrowRight size={18} /></button></div>
    </ScreenFrame>,

    <ScreenFrame key="boundary" onNavigate={navTo}>
      <TopBar title="UPI Boundary" onBack={() => setScreen(1)} />
      <div className="screen-scroll setup-content boundary-screen">
        <div className="boundary-hero"><p className="eyebrow">Weekly boundary</p><h2>{inr(boundary)}</h2><p>of {inr(safeToUse)} safe to use</p></div>
        <div className="slider-wrap"><span className="slider-value" style={{ left: `${((boundary - 3000) / 9000) * 100}%` }}>{inr(boundary)}</span><Slider min={3000} max={12000} step={500} value={[boundary]} onValueChange={(value) => setBoundary(value[0])} aria-label="Weekly UPI boundary" /><div className="slider-labels"><span>₹3,000</span><span>₹12,000</span></div></div>
        <div className="ratio-line"><span style={{ width: `${Math.min((boundary / safeToUse) * 100, 100)}%` }} /><p>This keeps one week’s UPI reference at {Math.round((boundary / safeToUse) * 100)}% of your safe-to-use money.</p></div>
        <div className="notice"><ShieldCheck size={18} /><div><b>This will not block your payments.</b><p>It is a personal reference you can change or pause.</p></div></div>
        <div className="feedback-block"><h3>When should we check in?</h3><p>Select any moments you want feedback.</p><div className="check-row">{[60, 80, 100].map((value) => <button key={value} className={feedback.includes(value) ? "selected" : ""} onClick={() => setFeedback((old) => old.includes(value) ? old.filter((v) => v !== value) : [...old, value])}><span>{feedback.includes(value) && <Check size={14} />}</span>{value}%</button>)}</div></div>
        <Accordion type="single" collapsible className="dark-accordion transparency"><AccordionItem value="why"><AccordionTrigger>Why this suggestion?</AccordionTrigger><AccordionContent><dl><div><dt>Why now</dt><dd>You received your salary and selected {inr(safeToUse)} as safe to use.</dd></div><div><dt>Your benefit</dt><dd>A weekly reference makes small UPI payments easier to notice.</dd></div><div><dt>Bank benefit</dt><dd>More of your everyday financial activity stays visible within this bank.</dd></div><div><dt>Your control</dt><dd>Change, pause or remove the boundary at any time.</dd></div></dl></AccordionContent></AccordionItem></Accordion>
      </div>
      <div className="sticky-action"><button className="primary-button" onClick={() => setScreen(3)}>Set {inr(boundary)} boundary</button></div>
    </ScreenFrame>,

    <ScreenFrame key="home" nav="home" onNavigate={navTo}>
      <div className="screen-scroll home-screen">
        <header className="home-header"><div><p>Good morning,</p><h2>Amogh.</h2></div><button className="icon-button avatar-button" aria-label="Profile">A</button></header>
        <section className="weather-hero">
          <Atmosphere condition={condition} />
          <div className="weather-copy"><span className="section-kicker">Money Weather <i /> Now</span><h1>{condition}.</h1><p>{condition === "Stable" ? "Your money has room." : condition === "Tightening" ? "Your spending is moving ahead of the week." : "Continuing at this pace may affect upcoming commitments."}</p></div>
          <div className="safe-line"><span className="metric-label">Safe to use</span><b>{inr(availableSafe)}</b></div>
        </section>
        <section className="home-pace"><PaceTrack spent={spent} boundary={boundary} /><p>You are still covered, but UPI spending is moving faster than the week.</p></section>
        {productRelevant && <section className="product-entry" aria-label="Pace Card suggestion">
          <div className="product-entry-label"><span>Credit line</span><CreditCard size={15} /></div>
          <h3>Get ₹2,000 more room this week</h3>
          <p>Your commitments are covered, but UPI spending is moving ahead of the week. Pace Card adds a short-term buffer, repaid automatically from your next salary.</p>
          <div className="product-entry-actions"><button onClick={() => setRecommendationView("detail")}>See why <ArrowRight size={15} /></button><button onClick={() => setRecommendationDismissed(true)}>Not interested</button></div>
        </section>}
        <div className="dual-actions"><button onClick={() => setScreen(5)}>What changed? <ArrowRight size={16} /></button><button onClick={() => setScreen(6)}>Review options <ArrowRight size={16} /></button></div>
        <section className="timeline-strip"><div className="section-heading"><span className="section-kicker">Coming up</span><b>Next: 20 Sep</b></div><div className="timeline-items"><div><CalendarDays size={16} /><span>20 Sep<b>Rent</b></span><strong>₹16,000</strong></div><div><CircleDollarSign size={16} /><span>22 Sep<b>Phone bill</b></span><strong>₹1,200</strong></div></div></section>
      </div>
      <button className="scan-fab" onClick={() => setScanning(true)} aria-label="Scan a UPI QR code"><QrCode size={22} /></button>
      {scanning && (
        <div className="scan-overlay" role="dialog" aria-modal="true" aria-label="Scanning for QR code">
          <button className="icon-button scan-close" onClick={() => { setScanning(false); setScanFound(false); }} aria-label="Cancel scan"><X size={18} /></button>
          <div className={`scan-frame ${scanFound ? "found" : ""}`}>
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            {scanFound ? <div className="scan-check"><Check size={34} /></div> : <div className="scan-line" />}
          </div>
          <p className="scan-caption">{scanFound ? "QR code recognized" : "Point your camera at a UPI QR code"}</p>
        </div>
      )}
    </ScreenFrame>,

    <ScreenFrame key="payment" nav="home" onNavigate={navTo}><div /></ScreenFrame>,

    <ScreenFrame key="changed" nav="activity" onNavigate={navTo}>
      <TopBar title="What changed" onBack={goHome} />
      <div className="screen-scroll narrative-screen">
        <div className="change-title"><span>Monday</span><b>Stable</b><ArrowRight size={19} /><span>Today</span><b>{condition}</b></div>
        <div className="factor-line">
          {[{ icon: WalletCards, label: "UPI spending reached", value: inr(spent) }, { icon: Gauge, label: "Weekly boundary used", value: `${usedPercent}%` }, { icon: CalendarDays, label: "Week completed", value: `${WEEK_PROGRESS}%` }].map(({ icon: Icon, label, value }, i) => <div className="factor" key={label}><span className="factor-number">0{i + 1}</span><Icon size={17} /><p>{label}</p><b>{value}</b></div>)}
        </div>
        <div className="payments-group"><div className="section-heading"><span className="section-kicker">Contributing payments</span><b>Grouped, not judged</b></div>{[{ name: "Food & coffee", count: "8 payments", amount: 1640 }, { name: "Travel", count: "11 payments", amount: 1380 }, { name: "Everyday purchases", count: "14 payments", amount: 1780 }].map((item) => <div key={item.name}><span>{item.name}<small>{item.count}</small></span><b>{inr(item.amount)}</b></div>)}</div>
        <div className="estimate-panel"><span className="section-kicker">Estimate</span><strong>+ ₹1,500</strong><p>At the current pace, you may use approximately ₹1,500 more than your selected weekly boundary.</p><small>This is an estimate, not a certainty.</small></div>
        <Accordion type="single" collapsible className="dark-accordion"><AccordionItem value="calculation"><AccordionTrigger>See calculation</AccordionTrigger><AccordionContent><p className="accordion-copy">You used {inr(spent)} across 4 of 7 days. Continuing at a similar daily pace gives a projected weekly total near {inr(boundary + 1500)}. Actual spending may differ.</p></AccordionContent></AccordionItem></Accordion>
      </div>
      <div className="sticky-action"><button className="primary-button" onClick={() => setScreen(6)}>See my options</button></div>
    </ScreenFrame>,

    <ScreenFrame key="options" nav="plan" onNavigate={navTo}>
      <TopBar title="Your options" onBack={() => setScreen(5)} />
      <div className="screen-scroll options-screen"><div className="section-intro"><p className="eyebrow">Three routes. Your call.</p><h2>What feels realistic<br />for this week?</h2></div>
        <div className="route-list">
          {[{ id: "slow" as const, title: "Slow the pace", lead: "Use up to ₹1,200 more", body: "No boundary change. Your condition may return to Stable.", meta: "No payment restrictions" }, { id: "adjust" as const, title: "Adjust the boundary", lead: "₹6,000 → ₹7,500", body: "Safe to use becomes ₹22,500. The condition stays Tightening.", meta: "Reversible at any time" }, { id: "none" as const, title: "Make no change", lead: "Keep using UPI normally", body: "The app keeps providing feedback. Nothing is blocked.", meta: "No action required" }].map((route) => <button key={route.id} className={`route-panel ${choice === route.id ? "selected" : ""}`} onClick={() => setChoice(route.id)}><span className="route-radio">{choice === route.id && <i />}</span><div><span>{route.title}</span><strong>{route.lead}</strong><p>{route.body}</p><small>{route.meta}</small></div></button>)}
        </div>
        <p className="control-note">Every option keeps you in control and can be changed later.</p>
      </div>
      <div className="sticky-action"><button className="primary-button" disabled={!choice} onClick={() => { if (choice === "adjust") setBoundary(7500); setScreen(7); }}>{choice ? "Continue with this route" : "Choose an option"}</button></div>
    </ScreenFrame>,

    <ScreenFrame key="review" nav="plan" onNavigate={navTo}>
      <TopBar title="Weekly review" onBack={() => setScreen(6)} />
      <div className="screen-scroll review-screen">
        <div className="review-hero"><span className="section-kicker">This week</span><h2>You noticed the shift<br />while there was time.</h2><div className="review-glow" /></div>
        <div className="comparison"><div><span>Boundary</span><b>{inr(boundary)}</b></div><div><span>Actual UPI</span><b>{inr(spent)}</b></div><div className="comparison-line"><i style={{ left: `${WEEK_PROGRESS}%` }} /><em style={{ width: `${Math.min(usedPercent, 100)}%` }} /></div><p><span>{WEEK_PROGRESS}% week progress</span><span>{usedPercent}% spending progress</span></p></div>
        <div className="review-stats"><div><span>Days stable</span><b>3</b></div><div><span>Days tightening</span><b>4</b></div><div><span>Safe-to-use impact</span><b>−{inr(spent)}</b></div></div>
        <div className="influence"><span className="section-kicker">Main influence</span><div><ReceiptText size={17} /><p>33 small UPI payments</p><b>{inr(spent)}</b></div></div>
        <div className="next-week"><h3>What would you like to do next week?</h3>{[{ id: "keep" as const, label: `Keep ${inr(boundary)}` }, { id: "adjust" as const, label: "Adjust the amount" }, { id: "pause" as const, label: "Pause the boundary" }].map((item) => <button key={item.id} onClick={() => setReviewChoice(item.id)} className={reviewChoice === item.id ? "selected" : ""}><span>{reviewChoice === item.id && <Check size={14} />}</span>{item.label}</button>)}</div>
        <p className="closing-summary">You stayed in control because you noticed the change while there was still time to respond.</p>
      </div>
      <div className="sticky-action"><button className="primary-button" onClick={goHome}>{reviewChoice === "pause" ? "Pause for next week" : reviewChoice === "adjust" ? "Adjust next week" : "Keep my boundary"}</button></div>
    </ScreenFrame>,
  ], [availableSafe, boundary, choice, commitments, condition, creditActivated, feedback, other, paymentDone, planned, productRelevant, rent, reviewChoice, safeToUse, scanFound, scanning, spent, usedPercent]);

  return (
    <main className="stage">
      <section className="phone" aria-label="Money Weather mobile prototype">
        <div className="status-row" aria-hidden="true"><span>9:41</span><div className="status-icons"><i /><i /><i /></div></div>
        <div className="screen-transition" key={screen}>{screens[screen]}</div>
      </section>
      <aside className="prototype-rail" aria-label="Prototype screens">
        <span>Money Weather</span><p>{String(screen + 1).padStart(2, "0")} / 08</p>
        <div>{Array.from({ length: 8 }, (_, index) => <button key={index} className={screen === index ? "active" : ""} onClick={() => setScreen(index)} aria-label={`Go to screen ${index + 1}`} />)}</div>
        <small>Use the dots to inspect any screen.</small>
      </aside>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="payment-sheet">
          <div className="sheet-handle" />
          <SheetTitle className="sheet-title"><span>Payment successful</span><strong>₹320 paid</strong></SheetTitle>
          <SheetDescription className="sheet-description">City Coffee · UPI</SheetDescription>
          <div className="payment-update"><span>Updated this week</span><b>{inr(spent)} <em>{usedPercent}% used</em></b></div>
          <PaceTrack spent={spent} boundary={boundary} mini />
          <p className="sheet-message">Your payment went through. You are now using your boundary faster than the week is moving.</p>
          <button className="primary-button" onClick={() => { setSheetOpen(false); setScreen(5); }}>View impact</button>
          <SheetClose asChild><button className="text-button">Dismiss</button></SheetClose>
        </SheetContent>
      </Sheet>

      <Sheet open={recommendationView !== null} onOpenChange={(open) => { if (!open) setRecommendationView(null); }}>
        <SheetContent side="bottom" showCloseButton={false} className="payment-sheet recommendation-sheet">
          <div className="sheet-handle" />

          {recommendationView === "detail" && <>
            <div className="sheet-product-label"><span>Credit line</span><CreditCard size={15} /></div>
            <SheetTitle className="recommendation-title">Pace Card</SheetTitle>
            <SheetDescription className="recommendation-description">A ₹2,000 buffer credit for this week, automatically settled from your next salary.</SheetDescription>

            <section className="recommendation-lead"><h3>Why this appeared</h3><p>Your UPI spending has used {usedPercent}% of its weekly boundary while {WEEK_PROGRESS}% of the week has passed. Your commitments remain covered, so this suggestion offers a short-term credit buffer instead of cutting into money you’ve already planned.</p></section>
            <Accordion type="single" collapsible className="dark-accordion recommendation-calculation"><AccordionItem value="product-calculation"><AccordionTrigger>See calculation</AccordionTrigger><AccordionContent><p className="accordion-copy">Safe to use is {inr(availableBeforeProduct)} this week. Activating Pace Card adds a {inr(PRODUCT_AMOUNT)} credit buffer, taking what you can spend to {inr(productRemainingSafe)}. Your UPI boundary stays {inr(boundary)}, and the {inr(PRODUCT_AMOUNT)} is repaid automatically when your next salary arrives.</p></AccordionContent></AccordionItem></Accordion>

            <div className="benefit-pair">
              <section><h3>What you gain</h3><ul><li>₹2,000 of extra spending room for this week.</li><li>No interest if repaid in full on your next salary date.</li><li>Nothing changes about how you already pay with UPI.</li></ul></section>
              <section><h3>How the bank gains</h3><ul><li>Interest applies if the balance carries beyond the repayment date.</li><li>The bank earns interchange fees on card transactions.</li><li>It builds your usage history for future credit products.</li></ul></section>
            </div>

            <section className="recommendation-section"><h3>Costs and limitations</h3><ul><li>Unpaid balances after the due date start accruing interest.</li><li>Using the full buffer regularly can affect your credit utilization.</li><li>Approval depends on your existing credit eligibility.</li><li>The outcome depends on repaying it on time.</li></ul></section>
            <section className="recommendation-section"><h3>Your other options</h3><ol><li>Slow UPI spending.</li><li>Adjust the boundary.</li><li>Wait for your next salary without extra credit.</li><li>Make no change.</li></ol></section>

            <div className="recommendation-actions"><button className="primary-button" onClick={() => setRecommendationView("review")}>Review card terms</button><button className="quiet-button" onClick={() => setRecommendationView(null)}>Not now</button><button className="text-button" onClick={() => { setRecommendationDismissed(true); setRecommendationView(null); }}>Don’t show this again</button></div>
          </>}

          {recommendationView === "compare" && <>
            <div className="sheet-product-label"><span>Option comparison</span><SlidersHorizontal size={15} /></div>
            <SheetTitle className="recommendation-title">Compare the ways forward</SheetTitle>
            <SheetDescription className="recommendation-description">The bank product is one option. Nothing is selected here.</SheetDescription>
            <div className="comparison-list">
              {[
                { option: "Slow spending", effect: "Keeps the ₹6,000 boundary", access: "Fully accessible", product: false },
                { option: "Adjust boundary", effect: "Changes the spending reference", access: "Fully accessible", product: false },
                { option: "Wait without credit", effect: "No extra buffer added", access: "Fully accessible", product: false },
                { option: "Pace Card", effect: "Adds ₹2,000 credit for this week", access: "Repaid from next salary", product: true },
                { option: "Make no change", effect: "No immediate change", access: "Fully accessible", product: false },
              ].map((item) => <section className="comparison-row" key={item.option}><div><h3>{item.option}</h3><span>{item.product ? "Credit line" : "No credit line"}</span></div><dl><div><dt>Effect</dt><dd>{item.effect}</dd></div><div><dt>Access</dt><dd>{item.access}</dd></div></dl></section>)}
            </div>
            <div className="recommendation-actions"><button className="quiet-button" onClick={() => setRecommendationView("detail")}>See product details</button><button className="text-button" onClick={() => setRecommendationView(null)}>Back to my options</button></div>
          </>}

          {recommendationView === "review" && <>
            <div className="sheet-product-label"><span>Review before confirming</span><CreditCard size={15} /></div>
            <SheetTitle className="recommendation-title">Pace Card</SheetTitle>
            <SheetDescription className="recommendation-description">Nothing is activated until you confirm.</SheetDescription>
            <div className="review-amount"><span>Credit added this week</span><b>{inr(PRODUCT_AMOUNT)}</b><small>{inr(productRemainingSafe)} available to spend this week</small></div>
            <dl className="review-details"><div><dt>Repayment</dt><dd>Auto-settled from your next salary</dd></div><div><dt>Applicable terms</dt><dd>Review before activation</dd></div><div><dt>UPI</dt><dd>No change to how you pay</dd></div></dl>
            <div className="benefit-pair review-benefits"><section><h3>Your benefit</h3><p>₹2,000 becomes available to spend this week, without touching your commitments.</p></section><section><h3>Bank benefit</h3><p>The bank earns interest only if you don’t repay in full by your next salary date.</p></section></div>
            <Accordion type="single" collapsible className="dark-accordion recommendation-calculation"><AccordionItem value="terms"><AccordionTrigger>Applicable interest and terms</AccordionTrigger><AccordionContent><p className="accordion-copy">The applicable interest rate and complete card terms should be provided by the bank for review before activation. This prototype does not state an APR or guarantee approval.</p></AccordionContent></AccordionItem></Accordion>
            <p className="optional-note"><ShieldCheck size={16} />This is optional and does not affect your ability to use UPI.</p>
            <div className="recommendation-actions"><button className="primary-button" onClick={() => { setCreditActivated(true); setRecommendationView("confirmed"); }}>Activate Pace Card</button><button className="text-button" onClick={() => setRecommendationView("detail")}>Go back</button></div>
          </>}

          {recommendationView === "confirmed" && <div className="confirmation-state">
            <span className="confirmation-icon"><Check size={22} /></span>
            <SheetTitle>₹2,000 credit is now active</SheetTitle>
            <SheetDescription>Pace Card is active. Your Money Weather stays {condition}, and {inr(availableSafe)} is now available to spend this week.</SheetDescription>
            <div className="confirmation-summary"><span>Credit added</span><b>{inr(PRODUCT_AMOUNT)}</b><small>Auto-repaid from your next salary</small></div>
            <button className="primary-button" onClick={() => { setRecommendationView(null); setScreen(3); }}>Back to Money Weather</button>
          </div>}
        </SheetContent>
      </Sheet>
    </main>
  );
}
