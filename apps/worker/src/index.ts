export function getWorkerServiceInfo() {
  return {
    ok: true,
    service: "worker",
  } as const
}

if (import.meta.main) {
  console.info("[worker] meeting-agent worker ready")
}
