-- CreateTable
CREATE TABLE "notification_role_defaults" (
    "organizationId" TEXT NOT NULL,
    "role" "AppRole" NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notification_role_defaults_pkey" PRIMARY KEY ("organizationId","role","kind")
);

-- AddForeignKey
ALTER TABLE "notification_role_defaults" ADD CONSTRAINT "notification_role_defaults_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
