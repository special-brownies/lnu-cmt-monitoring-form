import { apiClient } from "@/lib/api/client"
import type {
  CategoryRecord,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/equipment"

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

export function updateCategory(input: UpdateCategoryInput) {
  return apiClient<CategoryRecord>(`/categories/${input.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description,
    }),
  })
}

export function deleteCategory(id: number) {
  return apiClient<CategoryRecord>(`/categories/${id}`, {
    method: "DELETE",
  })
}
