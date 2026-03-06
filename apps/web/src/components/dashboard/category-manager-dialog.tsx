"use client"

import { FormEvent, ReactElement, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangleIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ActionIcon } from "@/components/ui/action-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/api/categories"
import { getEquipmentList } from "@/lib/api/equipment"
import type { CategoryRecord, CreateCategoryInput, EquipmentRecord, UpdateCategoryInput } from "@/types/equipment"

type CategoryManagerDialogProps = {
  trigger: ReactElement
}

type CategoryMutationContext = {
  previousCategories: CategoryRecord[]
}

type CategoryFormState = {
  name: string
  description: string
}

const defaultForm: CategoryFormState = {
  name: "",
  description: "",
}

function formatDateOnly(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toISOString().slice(0, 10)
}

export function CategoryManagerDialog({ trigger }: CategoryManagerDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CategoryFormState>(defaultForm)
  const [localError, setLocalError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<CategoryFormState>(defaultForm)
  const [initialEditValues, setInitialEditValues] = useState<CategoryFormState>(defaultForm)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryRecord | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    enabled: open,
  })

  const equipmentQuery = useQuery({
    queryKey: ["equipment", "categories-usage"],
    queryFn: () => getEquipmentList(),
    enabled: open,
  })

  const categories = categoriesQuery.data
  const equipments = equipmentQuery.data

  const sortedCategories = useMemo(() => {
    return [...(categories ?? [])].sort((first, second) => first.id - second.id)
  }, [categories])

  const equipmentByCategory = useMemo(() => {
    const mapping = new Map<number, EquipmentRecord[]>()

    for (const equipment of equipments ?? []) {
      const list = mapping.get(equipment.categoryId) ?? []
      list.push(equipment)
      mapping.set(equipment.categoryId, list)
    }

    return mapping
  }, [equipments])

  const equipmentUsingDeleteTarget = useMemo(() => {
    if (!deleteTarget) {
      return []
    }

    return equipmentByCategory.get(deleteTarget.id) ?? []
  }, [deleteTarget, equipmentByCategory])

  const normalizedEditValues = useMemo(
    () => ({
      name: editForm.name.trim(),
      description: editForm.description.trim(),
    }),
    [editForm],
  )

  const normalizedInitialEditValues = useMemo(
    () => ({
      name: initialEditValues.name.trim(),
      description: initialEditValues.description.trim(),
    }),
    [initialEditValues],
  )

  const hasEditChanges = useMemo(() => {
    return JSON.stringify(normalizedEditValues) !== JSON.stringify(normalizedInitialEditValues)
  }, [normalizedEditValues, normalizedInitialEditValues])

  const hasDuplicateName = (name: string, ignoreId?: number) => {
    const normalizedName = name.trim().toLowerCase()

    return (categories ?? []).some(
      (category) =>
        category.id !== ignoreId &&
        category.name.trim().toLowerCase() === normalizedName,
    )
  }

  const invalidateRelatedQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ["categories"] })
    await queryClient.invalidateQueries({ queryKey: ["equipment"] })
    await queryClient.invalidateQueries({ queryKey: ["equipmentStats"] })
    await queryClient.invalidateQueries({ queryKey: ["dashboard", "analytics"] })
  }

  const createMutation = useMutation({
    mutationFn: createCategory,
    onMutate: async (payload): Promise<CategoryMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ["categories"] })
      const previousCategories =
        queryClient.getQueryData<CategoryRecord[]>(["categories"]) ?? []

      const optimisticCategory: CategoryRecord = {
        id: -Date.now(),
        name: payload.name,
        description: payload.description?.trim() ? payload.description.trim() : null,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<CategoryRecord[]>(
        ["categories"],
        [...previousCategories, optimisticCategory],
      )

      return { previousCategories }
    },
    onError: (error, _payload, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories)
      }

      setLocalError(error instanceof Error ? error.message : "Unable to create category")
    },
    onSuccess: () => {
      setForm(defaultForm)
      setLocalError(null)
    },
    onSettled: invalidateRelatedQueries,
  })

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onMutate: async (payload): Promise<CategoryMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ["categories"] })
      const previousCategories =
        queryClient.getQueryData<CategoryRecord[]>(["categories"]) ?? []

      queryClient.setQueryData<CategoryRecord[]>(
        ["categories"],
        previousCategories.map((category) =>
          category.id === payload.id
            ? {
                ...category,
                name: payload.name,
                description: payload.description?.trim() ? payload.description.trim() : null,
              }
            : category,
        ),
      )

      return { previousCategories }
    },
    onError: (error, _payload, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories)
      }

      setEditError(error instanceof Error ? error.message : "Unable to update category")
    },
    onSuccess: () => {
      setEditError(null)
      setEditOpen(false)
      setEditingCategoryId(null)
      setEditForm(defaultForm)
      setInitialEditValues(defaultForm)
    },
    onSettled: invalidateRelatedQueries,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onMutate: async (categoryId): Promise<CategoryMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ["categories"] })
      const previousCategories =
        queryClient.getQueryData<CategoryRecord[]>(["categories"]) ?? []

      queryClient.setQueryData<CategoryRecord[]>(
        ["categories"],
        previousCategories.filter((category) => category.id !== categoryId),
      )

      return { previousCategories }
    },
    onError: (error, _payload, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories)
      }

      setDeleteError(error instanceof Error ? error.message : "Unable to delete category")
    },
    onSuccess: () => {
      setDeleteError(null)
      setDeleteTarget(null)
    },
    onSettled: invalidateRelatedQueries,
  })

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)

    const name = form.name.trim()
    const description = form.description.trim()

    if (name.length < 2) {
      setLocalError("Category name must be at least 2 characters.")
      return
    }

    if (hasDuplicateName(name)) {
      setLocalError("Category name already exists.")
      return
    }

    const payload: CreateCategoryInput = {
      name,
      description: description.length > 0 ? description : undefined,
    }

    try {
      await createMutation.mutateAsync(payload)
    } catch {
      // Handled in mutation callbacks.
    }
  }

  const openEditDialog = (category: CategoryRecord) => {
    const values: CategoryFormState = {
      name: category.name,
      description: category.description ?? "",
    }

    setEditingCategoryId(category.id)
    setEditForm(values)
    setInitialEditValues(values)
    setEditError(null)
    setEditOpen(true)
  }

  const handleSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setEditError(null)

    if (editingCategoryId === null) {
      return
    }

    const name = editForm.name.trim()
    const description = editForm.description.trim()

    if (name.length < 2) {
      setEditError("Category name must be at least 2 characters.")
      return
    }

    if (hasDuplicateName(name, editingCategoryId)) {
      setEditError("Category name already exists.")
      return
    }

    const payload: UpdateCategoryInput = {
      id: editingCategoryId,
      name,
      description,
    }

    try {
      await updateMutation.mutateAsync(payload)
    } catch {
      // Handled in mutation callbacks.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)

        if (!nextOpen) {
          setForm(defaultForm)
          setLocalError(null)
          setDeleteTarget(null)
          setDeleteError(null)
          setEditError(null)
          setEditOpen(false)
          setEditingCategoryId(null)
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Category Manager</DialogTitle>
          <DialogDescription>
            Manage equipment categories by adding, editing, and deleting records.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2.25fr)_minmax(0,1fr)]">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800">Categories</h3>

            {categoriesQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : categoriesQuery.isError ? (
              <div className="space-y-4">
                <EmptyState
                  title="Unable to load categories"
                  description="There was an issue fetching category records."
                />
                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => void categoriesQuery.refetch()}>
                    Retry
                  </Button>
                </div>
              </div>
            ) : sortedCategories.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                No categories yet
              </div>
            ) : (
              <div className="max-h-[55vh] overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Category Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Created Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {sortedCategories.map((category) => (
                      <tr key={category.id}>
                        <td className="px-4 py-3 text-slate-800">{category.name}</td>
                        <td className="px-4 py-3 text-slate-700">{category.description || "-"}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDateOnly(category.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ActionIcon
                              icon={PencilIcon}
                              label={`Edit category ${category.name}`}
                              onClick={() => openEditDialog(category)}
                            />
                            <ActionIcon
                              icon={Trash2Icon}
                              label={`Delete category ${category.name}`}
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => {
                                setDeleteError(null)
                                setDeleteTarget(category)
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800">Add Category</h3>

            <form className="mt-3 space-y-3" onSubmit={handleCreateCategory}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="category-name">
                  Category Name
                </label>
                <Input
                  id="category-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Laptop"
                  required
                  minLength={2}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="category-description">
                  Description (Optional)
                </label>
                <Input
                  id="category-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Devices for mobile computing"
                  maxLength={255}
                />
              </div>

              {localError && (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {localError}
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Category"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </DialogContent>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Delete ${deleteTarget.name} from the category list.`
                : "Delete category"}
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && equipmentUsingDeleteTarget.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
              <div className="mb-2 flex items-start gap-2">
                <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  This category is currently assigned to{" "}
                  {equipmentUsingDeleteTarget.length} equipment record
                  {equipmentUsingDeleteTarget.length > 1 ? "s" : ""}. Reassign them
                  first before deleting this category.
                </p>
              </div>
              <ul className="list-disc space-y-1 pl-6">
                {equipmentUsingDeleteTarget.slice(0, 3).map((equipment) => (
                  <li key={equipment.id}>
                    {equipment.name} ({equipment.serialNumber})
                  </li>
                ))}
                {equipmentUsingDeleteTarget.length > 3 && (
                  <li>and {equipmentUsingDeleteTarget.length - 3} more</li>
                )}
              </ul>
            </div>
          )}

          {deleteTarget && equipmentQuery.isLoading && (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Checking category assignments...
            </p>
          )}

          {deleteError && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {deleteError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                !deleteTarget ||
                deleteMutation.isPending ||
                equipmentQuery.isLoading ||
                equipmentUsingDeleteTarget.length > 0
              }
              onClick={async () => {
                if (!deleteTarget) {
                  return
                }

                try {
                  await deleteMutation.mutateAsync(deleteTarget.id)
                } catch {
                  // Handled in mutation callbacks.
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(nextOpen) => {
          setEditOpen(nextOpen)

          if (!nextOpen) {
            setEditingCategoryId(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details and save your changes.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSaveEdit}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-category-name">
                Category Name
              </label>
              <Input
                id="edit-category-name"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                minLength={2}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="edit-category-description">
                Description (Optional)
              </label>
              <Input
                id="edit-category-description"
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                maxLength={255}
              />
            </div>

            {editError && (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {editError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!hasEditChanges || updateMutation.isPending}
                className="disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
