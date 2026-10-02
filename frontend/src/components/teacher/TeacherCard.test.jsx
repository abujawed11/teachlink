import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import TeacherCard from "./TeacherCard";

function baseTeacher(overrides = {}) {
  return {
    slug: "rahul-kumar-abcd",
    name: "Rahul Kumar",
    headline: "Experienced Math Tutor",
    photoUrl: null,
    isVerified: false,
    city: "Bokaro",
    area: "Sector 4",
    experienceYears: 5,
    feeMin: 500,
    feeMax: 1000,
    subjects: ["Math", "Physics"],
    grades: ["Class 9", "Class 10"],
    modes: ["Online", "Offline"],
    ...overrides,
  };
}

function renderCard(teacher) {
  return render(
    <MemoryRouter>
      <TeacherCard teacher={teacher} />
    </MemoryRouter>
  );
}

describe("TeacherCard", () => {
  it("renders the teacher's name, headline, and location", () => {
    renderCard(baseTeacher());
    expect(screen.getByText("Rahul Kumar")).toBeInTheDocument();
    expect(screen.getByText("Experienced Math Tutor")).toBeInTheDocument();
    expect(screen.getByText(/Sector 4, Bokaro/)).toBeInTheDocument();
  });

  it("links to the teacher's public profile by slug", () => {
    renderCard(baseTeacher());
    expect(screen.getByRole("link")).toHaveAttribute("href", "/teachers/rahul-kumar-abcd");
  });

  it("shows a verified badge only when isVerified is true", () => {
    const { rerender } = renderCard(baseTeacher({ isVerified: false }));
    expect(screen.queryByTitle("Verified")).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <TeacherCard teacher={baseTeacher({ isVerified: true })} />
      </MemoryRouter>
    );
    expect(screen.getByTitle("Verified")).toBeInTheDocument();
  });

  it("falls back to the first letter of the name when there is no photo", () => {
    renderCard(baseTeacher({ photoUrl: null }));
    expect(screen.getByText("R")).toBeInTheDocument();
  });

  it("renders an avatar image when a photo is set", () => {
    const { container } = renderCard(baseTeacher({ photoUrl: "https://example.com/p.jpg" }));
    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.com/p.jpg");
  });

  it("shows the fee range with a rupee sign when fees are set", () => {
    renderCard(baseTeacher());
    expect(screen.getByText(/₹500/)).toBeInTheDocument();
    expect(screen.getByText(/₹1000/)).toBeInTheDocument();
  });

  it("hides the fee line when no fee is set", () => {
    renderCard(baseTeacher({ feeMin: null, feeMax: null }));
    expect(screen.queryByText(/\/ month/)).not.toBeInTheDocument();
  });

  it("caps subject chips at 3 and shows a +N more label", () => {
    renderCard(
      baseTeacher({ subjects: ["Math", "Physics", "Chemistry", "Biology", "English"] })
    );
    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.getByText("Chemistry")).toBeInTheDocument();
    expect(screen.queryByText("Biology")).not.toBeInTheDocument();
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("falls back to 'Teacher' when there is no headline", () => {
    renderCard(baseTeacher({ headline: null }));
    expect(screen.getByText("Teacher")).toBeInTheDocument();
  });
});
