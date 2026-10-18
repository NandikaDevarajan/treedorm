import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LeafChip } from "../LeafChip";
import { SearchField } from "../SearchField";
import { WoodButton } from "../WoodButton";

describe("WoodButton", () => {
  it("renders a type=button by default so it never submits forms by accident", () => {
    render(<WoodButton>Book</WoodButton>);
    expect(screen.getByRole("button", { name: "Book" })).toHaveAttribute("type", "button");
  });

  it("renders a link when given href", () => {
    render(<WoodButton href="/market">Enter the village</WoodButton>);
    expect(screen.getByRole("link", { name: "Enter the village" })).toHaveAttribute("href", "/market");
  });
});

describe("LeafChip", () => {
  it("exposes its selected state and handles taps", () => {
    const onClick = vi.fn();
    render(
      <LeafChip selected onClick={onClick}>
        Photos
      </LeafChip>,
    );
    const chip = screen.getByRole("button", { name: "Photos" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(chip);
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("SearchField", () => {
  it("is reachable by its label even when the label is visually hidden", () => {
    render(<SearchField label="Search treehouses" />);
    expect(screen.getByRole("searchbox", { name: "Search treehouses" })).toBeInTheDocument();
  });
});
