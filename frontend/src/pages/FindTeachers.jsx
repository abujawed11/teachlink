import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { getBoards, getGrades, getLanguages, getSubjects } from "../api/lookupApi";
import { searchTeachers } from "../api/teacherApi";
import FilterBar from "../components/teacher/FilterBar";
import TeacherCard from "../components/teacher/TeacherCard";

const FILTER_KEYS = [
  "subject",
  "grade",
  "board",
  "language",
  "city",
  "mode",
  "feeMax",
  "experienceMin",
];

const SORTS = [
  ["newest", "Newest first"],
  ["experience_desc", "Most experienced"],
  ["fee_asc", "Fee: low to high"],
  ["fee_desc", "Fee: high to low"],
];

function FindTeachers() {
  // The URL is the single source of truth for filters, so results are shareable/bookmarkable.
  const [searchParams, setSearchParams] = useSearchParams();
  const [lookups, setLookups] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) || ""]));
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page")) || 1;
  const activeCount = FILTER_KEYS.filter((key) => filters[key]).length;
  const query = searchParams.toString();

  useEffect(() => {
    Promise.all([getSubjects(), getGrades(), getBoards(), getLanguages()])
      .then(([subjects, grades, boards, languages]) =>
        setLookups({ subjects, grades, boards, languages })
      )
      .catch(() => setError("Could not load filters"));
  }, []);

  useEffect(() => {
    let stale = false;
    searchTeachers(Object.fromEntries(new URLSearchParams(query)))
      .then((data) => {
        if (stale) return;
        setResult(data);
        setError("");
      })
      .catch((err) => {
        if (!stale) setError(err.response?.data?.error?.message || "Could not load teachers");
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    // A newer search supersedes this one, so late responses can't overwrite fresh results.
    return () => {
      stale = true;
    };
  }, [query]);

  const updateParams = useCallback(
    (mutate) => {
      setLoading(true);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const handleFilterChange = useCallback(
    (key, value) =>
      updateParams((params) => {
        if (value) params.set(key, value);
        else params.delete(key);
        params.delete("page");
      }),
    [updateParams]
  );

  const handleClear = () =>
    updateParams((params) => {
      FILTER_KEYS.forEach((key) => params.delete(key));
      params.delete("page");
    });

  const handleSort = (value) =>
    updateParams((params) => {
      if (value === "newest") params.delete("sort");
      else params.set("sort", value);
      params.delete("page");
    });

  const goToPage = (nextPage) => {
    updateParams((params) => {
      if (nextPage <= 1) params.delete("page");
      else params.set("page", String(nextPage));
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pagination = result?.pagination;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Find Teachers</h1>
        <p className="text-slate-500">Search by subject, class, location and more.</p>
      </div>

      {lookups && (
        <FilterBar
          filters={filters}
          lookups={lookups}
          onChange={handleFilterChange}
          onClear={handleClear}
          activeCount={activeCount}
        />
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {pagination && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-slate-600">
            {pagination.total === 0
              ? "No teachers found"
              : `${pagination.total} teacher${pagination.total === 1 ? "" : "s"} found`}
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Sort by
            <select
              value={sort}
              onChange={(e) => handleSort(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-slate-700 bg-white"
            >
              {SORTS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {loading && !result && <p className="text-slate-500">Loading teachers...</p>}

      {result && result.teachers.length > 0 && (
        <div
          className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${
            loading ? "opacity-50" : ""
          }`}
        >
          {result.teachers.map((teacher) => (
            <TeacherCard key={teacher.slug} teacher={teacher} />
          ))}
        </div>
      )}

      {result && result.teachers.length === 0 && !loading && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center space-y-2">
          <p className="text-slate-700 font-medium">No teachers match these filters</p>
          <p className="text-sm text-slate-500">
            {activeCount > 0
              ? "Try removing a filter or searching a wider area."
              : "No teachers have published a profile yet — check back soon."}
          </p>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-indigo-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1 || loading}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= pagination.totalPages || loading}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default FindTeachers;
