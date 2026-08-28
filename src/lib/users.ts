import { readCollection } from "@/lib/db";
import type { Usuario } from "@/types";

const COLLECTION = "usuarios";

export function findUserByEmail(email: string): Usuario | undefined {
  const users = readCollection<Usuario>(COLLECTION);
  return users.find((u) => u.email === email);
}

export function findUserById(id: string): Usuario | undefined {
  const users = readCollection<Usuario>(COLLECTION);
  return users.find((u) => u.id === id);
}
