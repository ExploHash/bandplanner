"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function Chooser({ bandId }) {
  const [band, setBand] = useState(undefined); // undefined = loading, null = not found
  const [members, setMembers] = useState([]);

  useEffect(() => {
    async function load() {
      const [bandRes, memRes] = await Promise.all([
        supabase.from("bands").select("name").eq("id", bandId).maybeSingle(),
        supabase
          .from("band_members")
          .select("name")
          .eq("band_id", bandId)
          .order("created_at"),
      ]);
      setBand(bandRes.data ?? null);
      setMembers((memRes.data ?? []).map((m) => m.name));
    }
    load();
  }, [bandId]);

  if (band === undefined) {
    return <main className="screen home">Loading…</main>;
  }
  if (band === null) {
    return (
      <main className="screen home">
        <h1>🎸 BandPlanner</h1>
        <p className="explain">This band doesn&apos;t exist (anymore). Check the link.</p>
        <Link className="name-btn" href="/">
          Create a band
        </Link>
      </main>
    );
  }

  return (
    <main className="screen home">
      <h1>🎸 {band.name}</h1>
      {members.map((name) => (
        <Link
          key={name}
          className="name-btn"
          href={`/${bandId}/plan/${encodeURIComponent(name)}`}
        >
          {name}
        </Link>
      ))}
      <Link className="results-btn" href={`/${bandId}/results`}>
        Show results
      </Link>
      <Link className="settings-btn" href={`/${bandId}/settings`}>
        ⚙ Settings
      </Link>
    </main>
  );
}
