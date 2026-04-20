import { Hono } from "hono"

export function createWebApp() {
  return new Hono().get("/:orgSlug/meetings", (context) => {
    const orgSlug = context.req.param("orgSlug")

    return context.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Meeting agent</title>
  </head>
  <body>
    <main>
      <h1>Meeting agent</h1>
      <p>Workspace: ${orgSlug}</p>
      <form>
        <label for="meeting-url">Meeting URL</label>
        <input id="meeting-url" name="meetingUrl" type="url" />
        <button type="submit">Start meeting agent</button>
      </form>
    </main>
  </body>
</html>`)
  })
}
