import { describe, expect, test } from "vitest"

import { getWorkerServiceInfo } from "./index"

describe("worker service", () => {
  test("exposes the worker service name", () => {
    expect(getWorkerServiceInfo()).toEqual({
      ok: true,
      service: "worker",
    })
  })
})
