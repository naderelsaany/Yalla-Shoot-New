import { Metadata } from "next";
import WorldCupHubClient from "./WorldCupHubClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "كأس العالم | يلا شوت نيو",
    description: "متابعة شاملة لبطولة كأس العالم، جدول الترتيب، الهدافين، ومواعيد ونتائج المباريات.",
  };
}

export default async function WorldCupHub() {
  return <WorldCupHubClient />;
}
