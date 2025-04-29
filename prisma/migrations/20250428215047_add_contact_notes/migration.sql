-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "family_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "apt_number" TEXT,
    "zip_code" TEXT NOT NULL,
    "phone1" TEXT NOT NULL,
    "phone2" TEXT,
    "is_unhoused" BOOLEAN NOT NULL DEFAULT false,
    "is_temporary" BOOLEAN NOT NULL DEFAULT false,
    "member_status" TEXT NOT NULL DEFAULT 'active',
    "family_size" INTEGER NOT NULL,
    "adults" INTEGER NOT NULL,
    "school_aged" INTEGER NOT NULL,
    "small_children" INTEGER NOT NULL,
    "temporary_members" JSONB,
    "food_notes" TEXT,
    "office_notes" TEXT,
    "total_visits" INTEGER NOT NULL DEFAULT 0,
    "total_this_month" INTEGER NOT NULL DEFAULT 0,
    "last_visit" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "family_search_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "pickup_date" TIMESTAMP(3),
    "notes" TEXT,
    "delivery_type" TEXT NOT NULL,
    "is_new_client" BOOLEAN NOT NULL DEFAULT false,
    "approval_status" TEXT NOT NULL DEFAULT 'pending',
    "number_of_boxes" INTEGER NOT NULL DEFAULT 1,
    "additional_people" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneLog" (
    "id" TEXT NOT NULL,
    "family_search_id" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "call_type" TEXT NOT NULL,
    "call_outcome" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectedFamily" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "connected_to" TEXT NOT NULL,
    "relationship_type" TEXT,

    CONSTRAINT "ConnectedFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactNote" (
    "id" TEXT NOT NULL,
    "family_search_id" TEXT NOT NULL,
    "contact_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "contact_purpose" TEXT NOT NULL,
    "contact_method" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_family_number_key" ON "Client"("family_number");

-- CreateIndex
CREATE INDEX "ContactNote_family_search_id_idx" ON "ContactNote"("family_search_id");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_family_search_id_fkey" FOREIGN KEY ("family_search_id") REFERENCES "Client"("family_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneLog" ADD CONSTRAINT "PhoneLog_family_search_id_fkey" FOREIGN KEY ("family_search_id") REFERENCES "Client"("family_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedFamily" ADD CONSTRAINT "ConnectedFamily_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactNote" ADD CONSTRAINT "ContactNote_family_search_id_fkey" FOREIGN KEY ("family_search_id") REFERENCES "Client"("family_number") ON DELETE RESTRICT ON UPDATE CASCADE;
