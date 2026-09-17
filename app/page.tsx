"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, ChevronRight, CircleDollarSign,
  Gauge, Home, Landmark, Pause, ReceiptText, ShieldCheck, SlidersHorizontal,
  Sparkles, WalletCards,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

type Condition = "Stable" | "Tightening" | "Under Pressure";
type RouteChoice = "slow" | "adjust" | "none" | null;

const SALARY = 60000;
const SAVINGS = 12000;
const BASE_SPENT = 4800;
const WEEK_PROGRESS = 57;

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

function TopBar({ title, step, onBack }: { title: string; step: number; onBack?: () => void }) {
  return (
    <header className="topbar">
      {onBack ? <button className="icon-button" onClick={onBack} aria-label="Go back"><ArrowLeft size={19} /></button> : <span className="topbar-spacer" />}
      <span className="topbar-title">{title}</span>
      <span className="step-label">{String(step).padStart(2, "0")} / 08</span>
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
          <Icon size={19} /><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function ScreenFrame({ children, nav, onNavigate }: { children: ReactNode; nav?: "home" | "activity" | "plan"; onNavigate: (where: "home" | "activity" | "plan") => void }) {
  return <div className={`screen ${nav ? "with-nav" : ""}`}>{children}{nav && <BottomNav active={nav} onNavigate={onNavigate} />}</div>;
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

  const commitments = rent + planned + other;
  const safeToUse = Math.max(0, SALARY - SAVINGS - commitments);
  const availableSafe = Math.max(0, safeToUse - (choice === "adjust" ? Math.max(boundary - 6000, 0) : 0));
  const spent = BASE_SPENT + (paymentDone ? 320 : 0);
  const usedPercent = Math.round((spent / boundary) * 100);
  const condition: Condition = usedPercent <= WEEK_PROGRESS + 8 ? "Stable" : usedPercent <= 100 ? "Tightening" : "Under Pressure";

  const navTo = (where: "home" | "activity" | "plan") => setScreen(where === "home" ? 3 : where === "activity" ? 5 : 6);
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

  const screens = useMemo(() => [
    <ScreenFrame key="salary" onNavigate={navTo}>
      <div className="salary-screen">
        <header className="brand-row"><div className="brand-mark"><Sparkles size={15} /></div><span>Money Weather</span><span className="step-label">01 / 08</span></header>
        <div className="salary-copy"><p className="eyebrow">Your first salary is here.</p><h1>₹60,000</h1><div className="salary-meta"><span>Aster Labs</span><span>17 Sep 2026</span></div></div>
        <div className="opening-atmosphere"><Atmosphere condition="Stable" /><span className="section-kicker">Financial horizon <i /> Calm</span></div>
        <div className="arrival-note"><span className="note-index">01</span><p>We’ll separate what you can use from money that’s already spoken for.</p></div>
        <div className="screen-actions"><button className="primary-button" onClick={() => setScreen(1)}>Plan this salary <ArrowRight size={18} /></button><button className="text-button" onClick={() => setScreen(3)}>Not now</button></div>
      </div>
    </ScreenFrame>,

    <ScreenFrame key="commitments" onNavigate={navTo}>
      <TopBar title="Plan this salary" step={2} onBack={() => setScreen(0)} />
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
      <TopBar title="UPI Boundary" step={3} onBack={() => setScreen(1)} />
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
        <header className="home-header"><div><p>Good morning,</p><h2>Amogh.</h2></div><button className="icon-button" aria-label="Plan settings"><SlidersHorizontal size={18} /></button></header>
        <section className="weather-hero">
          <Atmosphere condition={condition} />
          <div className="weather-copy"><span className="section-kicker">Money Weather <i /> Now</span><h1>{condition}.</h1><p>{condition === "Stable" ? "Your money has room." : condition === "Tightening" ? "Your spending is moving ahead of the week." : "Continuing at this pace may affect upcoming commitments."}</p></div>
          <div className="safe-line"><span className="metric-label">Safe to use</span><b>{inr(availableSafe)}</b><small>After {inr(commitments)} in commitments{choice === "adjust" ? " and a boundary adjustment" : ""}</small></div>
        </section>
        <section className="home-pace"><PaceTrack spent={spent} boundary={boundary} /><p>You are still covered, but UPI spending is moving faster than the week.</p></section>
        <div className="dual-actions"><button onClick={() => setScreen(5)}>What changed? <ArrowRight size={16} /></button><button onClick={() => setScreen(6)}>Review options <ArrowRight size={16} /></button></div>
        <section className="timeline-strip"><div className="section-heading"><span className="section-kicker">Coming up</span><b>Next: 20 Sep</b></div><div className="timeline-items"><div><CalendarDays size={16} /><span>20 Sep<b>Rent</b></span><strong>₹16,000</strong></div><div><CircleDollarSign size={16} /><span>22 Sep<b>Phone bill</b></span><strong>₹1,200</strong></div></div></section>
        <button className="payment-trigger" onClick={() => { setPaymentDone(true); setSheetOpen(true); }}><span><WalletCards size={18} />Try a UPI payment</span><b>Pay ₹320 <ChevronRight size={17} /></b></button>
      </div>
    </ScreenFrame>,

    <ScreenFrame key="payment" nav="home" onNavigate={navTo}><div /></ScreenFrame>,

    <ScreenFrame key="changed" nav="activity" onNavigate={navTo}>
      <TopBar title="What changed" step={6} onBack={goHome} />
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
      <TopBar title="Your options" step={7} onBack={() => setScreen(5)} />
      <div className="screen-scroll options-screen"><div className="section-intro"><p className="eyebrow">Three routes. Your call.</p><h2>What feels realistic<br />for this week?</h2></div>
        <div className="route-list">
          {[{ id: "slow" as const, title: "Slow the pace", lead: "Use up to ₹1,200 more", body: "No boundary change. Your condition may return to Stable.", meta: "No payment restrictions" }, { id: "adjust" as const, title: "Adjust the boundary", lead: "₹6,000 → ₹7,500", body: "Safe to use becomes ₹22,500. The condition stays Tightening.", meta: "Reversible at any time" }, { id: "none" as const, title: "Make no change", lead: "Keep using UPI normally", body: "The app keeps providing feedback. Nothing is blocked.", meta: "No action required" }].map((route) => <button key={route.id} className={`route-panel ${choice === route.id ? "selected" : ""}`} onClick={() => setChoice(route.id)}><span className="route-radio">{choice === route.id && <i />}</span><div><span>{route.title}</span><strong>{route.lead}</strong><p>{route.body}</p><small>{route.meta}</small></div></button>)}
        </div>
        <p className="control-note">Every option keeps you in control and can be changed later.</p>
      </div>
      <div className="sticky-action"><button className="primary-button" disabled={!choice} onClick={() => { if (choice === "adjust") setBoundary(7500); setScreen(7); }}>{choice ? "Continue with this route" : "Choose an option"}</button></div>
    </ScreenFrame>,

    <ScreenFrame key="review" nav="plan" onNavigate={navTo}>
      <TopBar title="Weekly review" step={8} onBack={() => setScreen(6)} />
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
  ], [availableSafe, boundary, choice, commitments, condition, feedback, other, paymentDone, planned, rent, reviewChoice, safeToUse, spent, usedPercent]);

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
    </main>
  );
}
