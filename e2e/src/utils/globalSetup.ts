import { DbSetup } from "./db.setup";

export async function setup() {
  console.log("[Vitest E2E Global Setup] Preparando entorno...");
  // Limpiamos por si quedó basura de una ejecución anterior fallida
  await DbSetup.cleanupE2EData();
  // Semillamos el admin
  await DbSetup.seedE2EResponsable();
}

export async function teardown() {
  console.log("[Vitest E2E Global Teardown] Limpiando entorno...");
  // Limpiamos todo al finalizar
  await DbSetup.cleanupE2EData();
}
