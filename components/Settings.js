"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function Settings({ bandId }) {
  const [members, setMembers] = useState([]);
  const [allowRed, setAllowRed] = useState(true);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState(null);

  async function load() {
    const [memRes, bandRes] = await Promise.all([
      supabase
        .from("band_members")
        .select("id, name")
        .eq("band_id", bandId)
        .order("created_at"),
      supabase.from("bands").select("allow_red").eq("id", bandId).maybeSingle(),
    ]);
    if (memRes.error) setError(memRes.error.message);
    else setMembers(memRes.data);
    if (bandRes.data) setAllowRed(bandRes.data.allow_red);
  }

  useEffect(() => {
    load();
  }, [bandId]);

  async function addMember() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    const { error: err } = await supabase
      .from("band_members")
      .insert({ band_id: bandId, name });
    if (err) return setError("Could not add: " + err.message);
    setNewName("");
    load();
  }

  async function toggleRed() {
    const next = !allowRed;
    setAllowRed(next); // optimistic
    setError(null);
    const { error: err } = await supabase
      .from("bands")
      .update({ allow_red: next })
      .eq("id", bandId);
    if (err) {
      setAllowRed(!next);
      setError("Could not save setting: " + err.message);
    }
  }

  async function deleteMember(member) {
    if (
      !confirm(
        `Remove ${member.name}? Their availability answers are deleted too.`
      )
    )
      return;
    setError(null);
    // Remove their answers first, then the member itself.
    const { error: availErr } = await supabase
      .from("availability")
      .delete()
      .eq("band_id", bandId)
      .eq("name", member.name);
    if (availErr) return setError("Could not delete answers: " + availErr.message);
    const { error: err } = await supabase
      .from("band_members")
      .delete()
      .eq("id", member.id);
    if (err) return setError("Could not remove: " + err.message);
    load();
  }

  return (
    <main className="screen">
      <header className="cal-header">
        <Link className="back-btn" href={`/${bandId}`}>
          ← Back
        </Link>
        <h2>Settings</h2>
      </header>
      <p className="subtitle">Add or remove band members.</p>
      {members.map((m) => (
        <div className="member-row" key={m.id}>
          <span className="member-name">{m.name}</span>
          <button
            className="row-del"
            aria-label={`Remove ${m.name}`}
            onClick={() => deleteMember(m)}
          >
            ✕
          </button>
        </div>
      ))}
      <div className="member-row">
        <input
          className="text-input"
          placeholder="New member name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addMember()}
        />
        <button className="add-btn" onClick={addMember}>
          Add
        </button>
      </div>
      <h3 className="settings-heading">Options</h3>
      <div className="member-row">
        <span className="member-name toggle-label">
          Red button
          <small>Let members mark blocks as “not available”</small>
        </span>
        <button
          className={`switch ${allowRed ? "on" : ""}`}
          role="switch"
          aria-checked={allowRed}
          aria-label="Red button"
          onClick={toggleRed}
        >
          <span className="knob" />
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </main>
  );
}
