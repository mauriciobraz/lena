-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "privateVoiceConfigId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateVoiceConfig" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "allowChangeName" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateVoiceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guild_id_key" ON "Guild"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateVoiceConfig_id_key" ON "PrivateVoiceConfig"("id");

-- AddForeignKey
ALTER TABLE "Guild" ADD CONSTRAINT "Guild_privateVoiceConfigId_fkey" FOREIGN KEY ("privateVoiceConfigId") REFERENCES "PrivateVoiceConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
