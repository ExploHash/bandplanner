import Calendar from "@/components/Calendar";

export default async function PlanPage({ params }) {
  const { band, name } = await params;
  return <Calendar bandId={band} name={decodeURIComponent(name)} />;
}
