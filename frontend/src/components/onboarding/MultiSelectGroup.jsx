function MultiSelectGroup({ label, required, items, selected, onToggle, error }) {
  const isSelected = (id) => selected.some((item) => item.id === id);

  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = isSelected(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-slate-300 text-slate-600 hover:border-indigo-400"
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}

export default MultiSelectGroup;
