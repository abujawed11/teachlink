import MultiSelectGroup from "../MultiSelectGroup";

function StepSubjects({ values, onToggle, lookups, errors = {} }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Subjects &amp; Classes</h2>
      <p className="text-sm text-slate-500">What and who do you teach?</p>

      <MultiSelectGroup
        label="Subjects"
        required
        items={lookups.subjects}
        selected={values.subjects}
        onToggle={(item) => onToggle("subjects", item)}
        error={errors.subjects}
      />

      <MultiSelectGroup
        label="Classes / Grades"
        required
        items={lookups.grades}
        selected={values.grades}
        onToggle={(item) => onToggle("grades", item)}
        error={errors.grades}
      />

      <MultiSelectGroup
        label="Boards"
        items={lookups.boards}
        selected={values.boards}
        onToggle={(item) => onToggle("boards", item)}
      />

      <MultiSelectGroup
        label="Languages Spoken"
        items={lookups.languages}
        selected={values.languages}
        onToggle={(item) => onToggle("languages", item)}
      />
    </div>
  );
}

export default StepSubjects;
