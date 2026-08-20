import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Settings" };

const sections = [
  { title: "Demo account", description: "demo@spendlens.local · Authentication will be connected in a later milestone." },
  { title: "Currency preference", description: "PLN · Transactions retain their original ISO 4217 currency." },
  { title: "Data & privacy", description: "Uploaded financial documents will be private by default and accessed only through authenticated, short-lived links." },
];

export default function SettingsPage() {
  return <><PageHeader title="Settings" description="Account defaults and privacy controls for your SpendLens workspace." /><Card className="divide-y">{sections.map((section) => <section key={section.title} className="p-5 sm:p-6"><h2 className="font-semibold">{section.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{section.description}</p></section>)}</Card></>;
}
