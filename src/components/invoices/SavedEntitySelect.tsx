'use client'

// Dropdown over the user's saved clients/suppliers. The empty value means
// "entering a new one" — the parent form clears the selection when the user
// edits the name, since the name is what auto-save dedupes on. Hidden until
// the user has at least one saved entry.
export default function SavedEntitySelect({
  label,
  newLabel,
  options,
  selectedId,
  onChange,
}: {
  label: string
  newLabel: string
  options: { id: string; name: string }[]
  selectedId: string
  onChange: (id: string) => void
}) {
  if (options.length === 0) return null

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
      >
        <option value="">{newLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  )
}
