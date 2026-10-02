import ProfilePreviewCard from "../ProfilePreviewCard";

function StepReview({ values }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Review Your Profile</h2>
      <p className="text-sm text-slate-500">
        This is how your profile will appear. Review before publishing.
      </p>

      <ProfilePreviewCard values={values} />
    </div>
  );
}

export default StepReview;
