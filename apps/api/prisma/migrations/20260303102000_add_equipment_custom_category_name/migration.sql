ALTER TABLE "Equipment"
ADD COLUMN "customCategoryName" TEXT;

CREATE UNIQUE INDEX "Equipment_categoryId_customCategoryName_key"
ON "Equipment"("categoryId", "customCategoryName");
