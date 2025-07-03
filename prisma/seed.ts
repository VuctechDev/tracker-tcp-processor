import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const orgName = "Default";

  // 1. Upsert Default organization
  const org = await prisma.organizations.upsert({
    where: { name: orgName },
    update: {},
    create: { name: orgName },
  });

  console.log(`[SEED] Default organization ensured: ${org.id} - ${org.name}`);

  // 2. Assign all devices without an organizationId to the Default organization
  const updated = await prisma.devices.updateMany({
    where: {
      OR: [
        { organizationId: null },
        { organizationId: { equals: undefined } }, // defensive check
      ],
    },
    data: {
      organizationId: org.id,
    },
  });

  console.log(
    `[SEED] Assigned ${updated.count} devices to Default organization`
  );
}

main()
  .catch((e) => {
    console.error("[SEED ERROR]", e);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
