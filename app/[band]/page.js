import Chooser from "@/components/Chooser";

export default async function BandPage({ params }) {
  const { band } = await params;
  return <Chooser bandId={band} />;
}
