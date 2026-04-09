import type { Metadata } from "next";
import PlannerView from "./PlannerView";

export const metadata: Metadata = {
  title: "Planner",
};

export default function PlannerPage() {
  return <PlannerView />;
}
