import Settings from "@/components/Settings";

export default async function SettingsPage({ params }) {
  const { band } = await params;
  return <Settings bandId={band} />;
}
