import type { Metadata } from "next";
import ShoppingView from "./ShoppingView";

export const metadata: Metadata = {
  title: "Shopping List",
};

export default function ShoppingPage() {
  return <ShoppingView />;
}
