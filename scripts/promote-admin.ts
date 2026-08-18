import "dotenv/config";
import { prisma } from "../src/lib/db/prisma";
import { normalizeUsername } from "../src/lib/validation/auth";

const username = process.argv[2];
if (!username) {
  console.error("Usage: npm run admin:promote -- <username>");
  process.exit(1);
}

const user = await prisma.user.update({
  where: { normalizedUsername: normalizeUsername(username) },
  data: { role: "ADMIN" }
});
console.log(`Promoted ${user.username} to ADMIN.`);
await prisma.$disconnect();
