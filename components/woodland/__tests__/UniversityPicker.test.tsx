import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { SEED_SCHOOLS } from "@/lib/schools";
import { UniversityPicker } from "../UniversityPicker";

function Harness() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <>
      <UniversityPicker schools={SEED_SCHOOLS} value={value} onChange={setValue} />
      <output data-testid="value">{value ?? "none"}</output>
    </>
  );
}

describe("UniversityPicker", () => {
  it("filters as you type and picks with the keyboard", () => {
    render(<Harness />);
    const box = screen.getByRole("combobox", { name: "Your university" });
    fireEvent.change(box, { target: { value: "wash" } });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "University of Washingtonuw.edu",
      "Washington Statewsu.edu",
    ]);
    fireEvent.keyDown(box, { key: "ArrowDown" });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(screen.getByTestId("value")).toHaveTextContent("wsu.edu");
  });

  it("finds a school by its domain and lets you change it", () => {
    render(<Harness />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "berkeley.edu" } });
    fireEvent.mouseDown(screen.getByRole("option", { name: /UC Berkeley/ }));
    expect(screen.getByTestId("value")).toHaveTextContent("berkeley.edu");
    fireEvent.click(screen.getByRole("button", { name: /Change university/ }));
    expect(screen.getByTestId("value")).toHaveTextContent("none");
  });
});
