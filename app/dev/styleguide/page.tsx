import type { Metadata } from "next";
import { Styleguide } from "./Styleguide";

export const metadata: Metadata = {
  title: "Styleguide · Tree Dorm",
  robots: { index: false },
};

export default function StyleguidePage() {
  return <Styleguide />;
}
