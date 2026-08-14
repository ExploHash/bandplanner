import Calendar from "@/components/Calendar";

export default async function ResultsPage({ params }) {
  const { band } = await params;
  return <Calendar bandId={band} />;
}
