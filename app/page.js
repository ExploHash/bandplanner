"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function randomId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default function Home() {
  const [bandName, setBandName] = useState("");
  const [members, setMembers] = useState(["", "", ""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null); // band id after saving
  const [copied, setCopied] = useState(false);

  function setMember(i, value) {
    setMembers((m) => m.map((v, j) => (j === i ? value : v)));
  }

  async function createBand() {
    setError(null);
    const names = [...new Set(members.map((m) => m.trim()).filter(Boolean))];
    if (!bandName.trim()) return setError("Give your band a name.");
    if (names.length === 0) return setError("Add at least one member.");

    setSaving(true);
    const id = randomId();
    const { error: bandErr } = await supabase
      .from("bands")
      .insert({ id, name: bandName.trim() });
    if (bandErr) {
      setSaving(false);
      return setError("Could not create band: " + bandErr.message);
    }
    const { error: memErr } = await supabase
      .from("band_members")
      .insert(names.map((name) => ({ band_id: id, name })));
    setSaving(false);
    if (memErr) return setError("Could not save members: " + memErr.message);
    setCreated(id);
  }

  if (created) {
    const url = `${window.location.origin}/${created}`;
    return (
      <main className="screen home">
        <h1>🎸 {bandName.trim()}</h1>
        <p className="explain">Your band is ready! This is your band&apos;s private link:</p>
        <div className="share-box">
          <code>{url}</code>
        </div>
        <button
          className="results-btn"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          }}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        <p className="explain">
          Share it with your band members. Everyone opens the link, taps their own
          name and marks per day whether they can make it in the afternoon or
          evening: tap once for green (available), again for red (not available).
          The results page shows which blocks work for the whole band. Anyone with
          the link can answer, so keep it within the band — and save it somewhere,
          it&apos;s the only way back to your planner.
        </p>
        <a className="name-btn" href={`/${created}`}>
          Go to your planner →
        </a>
      </main>
    );
  }

  return (
    <main className="screen home">
      <h1>🎸 BandPlanner</h1>
      <p className="explain">
        Plan your band sessions: create your band, share the link, and everyone
        marks when they can make it.
      </p>
      <input
        className="text-input"
        placeholder="Band name"
        value={bandName}
        onChange={(e) => setBandName(e.target.value)}
      />
      {members.map((m, i) => (
        <div className="member-row" key={i}>
          <input
            className="text-input"
            placeholder={`Member ${i + 1}`}
            value={m}
            onChange={(e) => setMember(i, e.target.value)}
          />
          {members.length > 1 && (
            <button
              className="row-del"
              aria-label="Remove member"
              onClick={() => setMembers((arr) => arr.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button className="add-btn" onClick={() => setMembers((m) => [...m, ""])}>
        + Add member
      </button>
      {error && <p className="error">{error}</p>}
      <button className="results-btn" onClick={createBand} disabled={saving}>
        {saving ? "Creating…" : "Create band"}
      </button>
    </main>
  );
}
