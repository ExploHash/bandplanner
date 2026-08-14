"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function Settings({ bandId }) {
  const [members, setMembers] = useState([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState(null);

  async function load() {
    const { data, error: err } = await supabase
      .from("band_members")
      .select("id, name")
      .eq("band_id", bandId)
      .order("created_at");
    if (err) setError(err.message);
    else setMembers(data);
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
      {error && <p className="error">{error}</p>}
    </main>
  );
}
