import { apiClient } from "@/lib/api/client"
import type { CategoryRecord, CreateCategoryInput } from "@/types/equipment"

export function getCategories() {
  return apiClient<CategoryRecord[]>("/categories", { cache: "no-store" })
}

export function createCategory(input: CreateCategoryInput) {
  return apiClient<CategoryRecord>("/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })
}
