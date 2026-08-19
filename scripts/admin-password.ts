import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { normalizeUsername } from "@/lib/utils";

const username = process.env.ADMIN_TARGET_USERNAME?.trim();
const password = process.env.ADMIN_NEW_PASSWORD || "";
if (!username || password.length < 12) {
  console.error("Set ADMIN_TARGET_USERNAME and ADMIN_NEW_PASSWORD (minimum 12 characters). Avoid putting passwords in shell arguments.");
  process.exit(1);
}
const user = await prisma.user.findUnique({ where: { normalizedUsername: normalizeUsername(username) } });
if (!user) { console.error(`User ${username} was not found.`); process.exit(1); }
await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hash(password, 12) } });
await prisma.session.deleteMany({ where: { userId: user.id } });
console.log(`Password reset for ${user.username}; existing sessions were revoked.`);
