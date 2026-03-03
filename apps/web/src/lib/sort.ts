export type SortOption = "AZ" | "NEWEST" | "OLDEST"

export const SORT_OPTIONS: ReadonlyArray<{ value: SortOption; label: string }> = [
  { value: "AZ", label: "A-Z" },
  { value: "NEWEST", label: "Newest" },
  { value: "OLDEST", label: "Oldest" },
]

type SortAccessors<T> = {
  getPrimaryText: (item: T) => string
  getDateValue: (item: T) => string | number | Date | null | undefined
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
})

function toTimestamp(value: string | number | Date | null | undefined): number {
  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = new Date(value).getTime()
    return Number.isNaN(parsed) ? 0 : parsed
  }

  return 0
}

export function sortCollection<T>(
  items: readonly T[],
  sort: SortOption,
  accessors: SortAccessors<T>,
): T[] {
  const sorted = [...items]

  sorted.sort((left, right) => {
    const leftText = accessors.getPrimaryText(left).trim()
    const rightText = accessors.getPrimaryText(right).trim()
    const alphaCompare = collator.compare(leftText, rightText)

    if (sort === "AZ") {
      return alphaCompare
    }

    const leftTime = toTimestamp(accessors.getDateValue(left))
    const rightTime = toTimestamp(accessors.getDateValue(right))

    if (leftTime === rightTime) {
      return alphaCompare
    }

    if (sort === "NEWEST") {
      return rightTime - leftTime
    }

    return leftTime - rightTime
  })

  return sorted
}
