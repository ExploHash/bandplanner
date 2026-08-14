"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { BLOCK_LABELS } from "@/lib/config";
import { monthInfo, dayISO } from "@/lib/month";

export default function Calendar({ bandId, name }) {
  const resultsMode = !name;
  // 1 = next month (the default view)
  const [monthOffset, setMonthOffset] = useState(1);
  const M = monthInfo(monthOffset);
  // planner: { "iso|block": "green" | "red" }
  // results: { "iso|block": { green, red } }
  const [state, setState] = useState({});
  // planner mode: keys ("iso|block") that someone ELSE marked red
  const [othersRed, setOthersRed] = useState(new Set());
  // planner mode: how many OTHERS marked a key green
  const [othersGreen, setOthersGreen] = useState({});
  const [memberCount, setMemberCount] = useState(0);
  const [allowRed, setAllowRed] = useState(true);
  const [toast, setToast] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    async function load() {
      // Clear the previous month while the new one loads.
      setState({});
      setOthersRed(new Set());
      setOthersGreen({});
      // Load the whole month for everyone in this band: own rows drive the
      // colors, other people's reds drive the striped overlay.
      const [availRes, countRes, bandRes] = await Promise.all([
        supabase
          .from("availability")
          .select("name, day, block, status")
          .eq("band_id", bandId)
          .gte("day", dayISO(M.year, M.month, 1))
          .lte("day", dayISO(M.year, M.month, M.daysInMonth)),
        supabase
          .from("band_members")
          .select("id", { count: "exact", head: true })
          .eq("band_id", bandId),
        supabase.from("bands").select("allow_red").eq("id", bandId).maybeSingle(),
      ]);
      if (availRes.error) {
        showToast("Could not load data: " + availRes.error.message);
        return;
      }
      setMemberCount(countRes.count ?? 0);
      if (bandRes.data) setAllowRed(bandRes.data.allow_red);
      const next = {};
      const reds = new Set();
      const greens = {};
      for (const r of availRes.data) {
        const key = `${r.day}|${r.block}`;
        if (resultsMode) {
          next[key] = next[key] || { green: 0, red: 0 };
          next[key][r.status]++;
        } else if (r.name === name) {
          next[key] = r.status;
        } else if (r.status === "red") {
          reds.add(key);
        } else {
          greens[key] = (greens[key] || 0) + 1;
        }
      }
      setState(next);
      setOthersRed(reds);
      setOthersGreen(greens);
    }
    load();
  }, [bandId, name, resultsMode, monthOffset]);

  async function onBlockClick(iso, block) {
    const key = `${iso}|${block}`;
    const cur = state[key];
    // With red disabled the cycle is just green -> clear.
    const next =
      cur === "green" ? (allowRed ? "red" : null) : cur === "red" ? null : "green";

    // Optimistic update
    setState((s) => ({ ...s, [key]: next }));

    let error;
    if (next === null) {
      ({ error } = await supabase
        .from("availability")
        .delete()
        .eq("band_id", bandId)
        .eq("name", name)
        .eq("day", iso)
        .eq("block", block));
    } else {
      ({ error } = await supabase
        .from("availability")
        .upsert(
          { band_id: bandId, name, day: iso, block, status: next },
          { onConflict: "band_id,name,day,block" }
        ));
    }
    if (error) {
      setState((s) => ({ ...s, [key]: cur }));
      showToast("Save failed: " + error.message);
    }
  }

  function blockClass(key) {
    if (resultsMode) {
      const g = state[key]?.green ?? 0;
      let cls = "block"; // 0 or 1 green: no special color
      if (memberCount > 0 && g >= memberCount) cls = "block green"; // everyone can
      else if (g > 1) cls = "block orange"; // more than one, not all
      if (state[key]?.red > 0) cls += " striped"; // someone can't make it
      return cls;
    }
    let cls = state[key] ? `block ${state[key]}` : "block";
    if (othersRed.has(key)) cls += " striped";
    return cls;
  }

  const cells = [];
  for (let i = 0; i < M.firstWeekday; i++) {
    cells.push(<div key={`pad-${i}`} className="day empty" />);
  }
  for (let d = 1; d <= M.daysInMonth; d++) {
    const iso = dayISO(M.year, M.month, d);
    cells.push(
      <div key={iso} className="day">
        <div className="num">{d}</div>
        {[1, 2].map((block) => {
          const key = `${iso}|${block}`;
          // Green count: in results the full tally, on user pages
          // others' greens plus your own once you click.
          const count = resultsMode
            ? state[key]?.green ?? 0
            : (othersGreen[key] || 0) + (state[key] === "green" ? 1 : 0);
          return (
            <button
              key={block}
              className={blockClass(key)}
              title={BLOCK_LABELS[block - 1]}
              onClick={resultsMode ? undefined : () => onBlockClick(iso, block)}
            >
              {resultsMode ? count : count || ""}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <main className="screen">
      <header className="cal-header">
        <Link className="back-btn" href={`/${bandId}`}>
          ← Back
        </Link>
        <div className="month-nav">
          <button className="month-btn" aria-label="Previous month" onClick={() => setMonthOffset((o) => o - 1)}>
            ‹
          </button>
          <h2>{M.title}</h2>
          <button className="month-btn" aria-label="Next month" onClick={() => setMonthOffset((o) => o + 1)}>
            ›
          </button>
        </div>
      </header>
      <p className="subtitle">
        {resultsMode
          ? "Results — number of people available per block"
          : allowRed
            ? `${name} — tap a block: green = available, again = red, again = clear`
            : `${name} — tap a block: green = available, again = clear`}
      </p>
      <div className="weekdays">
        <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
      </div>
      <div className="grid">{cells}</div>
      <div className="legend">
        {resultsMode ? (
          <>
            <span className="l-green">All can</span>
            <span className="l-orange">2+ can</span>
            <span className="l-none">0–1 can</span>
            <span className="l-striped">Someone can&apos;t</span>
          </>
        ) : (
          <>
            <span className="l-green">Available</span>
            {allowRed && <span className="l-red">Not available</span>}
            <span className="l-none">No answer</span>
            <span className="l-striped">Someone can&apos;t</span>
          </>
        )}
      </div>
      <p className="subtitle block-hint">
        Top block = {BLOCK_LABELS[0].toLowerCase()}, bottom block = {BLOCK_LABELS[1].toLowerCase()}
      </p>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
