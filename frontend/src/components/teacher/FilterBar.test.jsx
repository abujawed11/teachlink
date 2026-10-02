import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FilterBar from "./FilterBar";

function baseFilters(overrides = {}) {
  return {
    subject: "",
    grade: "",
    city: "",
    board: "",
    mode: "",
    language: "",
    experienceMin: "",
    feeMax: "",
    ...overrides,
  };
}

const lookups = {
  subjects: [{ id: 1, name: "Math" }, { id: 2, name: "Science" }],
  grades: [{ id: 1, name: "Class 9" }, { id: 2, name: "Class 10" }],
  boards: [{ id: 1, name: "CBSE" }],
  languages: [{ id: 1, name: "English" }],
};

describe("FilterBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onChange immediately when selecting a subject", () => {
    const onChange = vi.fn();
    render(
      <FilterBar filters={baseFilters()} lookups={lookups} onChange={onChange} onClear={vi.fn()} activeCount={0} />
    );

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Math" },
    });

    expect(onChange).toHaveBeenCalledWith("subject", "Math");
  });

  it("debounces the city text input before committing", () => {
    const onChange = vi.fn();
    render(
      <FilterBar filters={baseFilters()} lookups={lookups} onChange={onChange} onClear={vi.fn()} activeCount={0} />
    );

    const cityInput = screen.getByPlaceholderText("e.g. Bokaro");
    fireEvent.change(cityInput, { target: { value: "Bokaro" } });

    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(onChange).toHaveBeenCalledWith("city", "Bokaro");
  });

  it("hides secondary filters by default and reveals them on click", () => {
    render(
      <FilterBar filters={baseFilters()} lookups={lookups} onChange={vi.fn()} onClear={vi.fn()} activeCount={0} />
    );

    expect(screen.queryByText("Board")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("More filters"));
    expect(screen.getByText("Board")).toBeInTheDocument();
  });

  it("auto-expands when a secondary filter is already active", () => {
    render(
      <FilterBar
        filters={baseFilters({ board: "CBSE" })}
        lookups={lookups}
        onChange={vi.fn()}
        onClear={vi.fn()}
        activeCount={1}
      />
    );

    expect(screen.getByText("Board")).toBeInTheDocument();
  });

  it("shows the active secondary filter count badge", () => {
    render(
      <FilterBar
        filters={baseFilters({ board: "CBSE", mode: "online" })}
        lookups={lookups}
        onChange={vi.fn()}
        onClear={vi.fn()}
        activeCount={2}
      />
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("only shows Clear all when activeCount is greater than 0", () => {
    const { rerender } = render(
      <FilterBar filters={baseFilters()} lookups={lookups} onChange={vi.fn()} onClear={vi.fn()} activeCount={0} />
    );
    expect(screen.queryByText(/Clear all filters/)).not.toBeInTheDocument();

    rerender(
      <FilterBar filters={baseFilters()} lookups={lookups} onChange={vi.fn()} onClear={vi.fn()} activeCount={3} />
    );
    expect(screen.getByText("Clear all filters (3)")).toBeInTheDocument();
  });

  it("calls onClear when Clear all is clicked", () => {
    const onClear = vi.fn();
    render(
      <FilterBar filters={baseFilters()} lookups={lookups} onChange={vi.fn()} onClear={onClear} activeCount={1} />
    );
    fireEvent.click(screen.getByText(/Clear all filters/));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
