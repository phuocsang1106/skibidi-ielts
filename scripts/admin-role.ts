import { prisma } from "@/lib/db";
import { normalizeUsername } from "@/lib/utils";

const username = process.env.ADMIN_TARGET_USERNAME?.trim();
const role = process.env.ADMIN_TARGET_ROLE?.trim().toUpperCase();
if (!username || (role !== "ADMIN" && role !== "USER")) {
  console.error("Set ADMIN_TARGET_USERNAME and ADMIN_TARGET_ROLE=ADMIN|USER.");
  process.exit(1);
}

const normalizedUsername = normalizeUsername(username);
const target = await prisma.user.findUnique({ where: { normalizedUsername } });
if (!target) {
  console.error(`User ${username} was not found.`);
  process.exit(1);
}
if (target.role === role) {
  console.log(`${target.username} is already ${role}.`);
  process.exit(0);
}
if (target.role === "ADMIN" && role === "USER") {
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount <= 1) {
    console.error("Refusing to demote the last administrator.");
    process.exit(1);
  }
}
await prisma.user.update({ where: { id: target.id }, data: { role } });
console.log(`${target.username} is now ${role}.`);
