export interface MeetingsPageOptions {
  orgSlug: string
  apiBaseUrl: string
}

export interface MeetingRunDetailPageOptions extends MeetingsPageOptions {
  runId: string
}

export function renderMeetingsPage(options: MeetingsPageOptions) {
  return pageShell({
    title: "Meeting agent",
    body: `<main class="shell" data-org-slug="${escapeHtml(options.orgSlug)}" data-api-base-url="${escapeHtml(options.apiBaseUrl)}">
  <section class="panel">
    <div>
      <p class="eyebrow">Workspace</p>
      <h1>Meeting agent</h1>
      <p class="muted">Start a meeting participant from a Meet, Zoom, or Teams URL.</p>
    </div>
    <form id="start-run-form" class="stack">
      <label>
        <span>Meeting URL</span>
        <input name="meetingUrl" type="url" required placeholder="https://meet.google.com/..." />
      </label>
      <label>
        <span>Bot name</span>
        <input name="botName" type="text" value="Otto Meeting Agent" />
      </label>
      <label>
        <span>Meeting purpose</span>
        <textarea name="meetingPurpose" rows="3" placeholder="Weekly product sync"></textarea>
      </label>
      <button type="submit">Start meeting agent</button>
      <p id="form-status" class="muted" role="status"></p>
    </form>
  </section>
  <section class="panel">
    <div class="section-title">
      <h2>Recent runs</h2>
      <button id="refresh-runs" type="button">Refresh</button>
    </div>
    <div id="run-list" class="stack"></div>
  </section>
</main>
<script>
const root = document.querySelector("[data-org-slug]");
const orgSlug = root.dataset.orgSlug;
const apiBaseUrl = root.dataset.apiBaseUrl;
const form = document.querySelector("#start-run-form");
const status = document.querySelector("#form-status");
const runList = document.querySelector("#run-list");

async function loadRuns() {
  const response = await fetch(apiBaseUrl + "/api/workspace/" + orgSlug + "/meeting-agent/runs");
  const data = await response.json();
  runList.innerHTML = data.runs.map((run) => '<a class="run-row" href="/' + orgSlug + '/meetings/' + run.id + '"><strong>' + escapeText(run.botName) + '</strong><span>' + escapeText(run.status) + '</span><small>' + escapeText(run.meetingUrl) + '</small></a>').join("");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "Starting...";
  const formData = new FormData(form);
  const response = await fetch(apiBaseUrl + "/api/workspace/" + orgSlug + "/meeting-agent/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      meetingUrl: formData.get("meetingUrl"),
      botName: formData.get("botName") || "Otto Meeting Agent",
      meetingPurpose: formData.get("meetingPurpose") || undefined
    })
  });
  const data = await response.json();
  if (!response.ok) {
    status.textContent = data.error || "Could not start meeting agent.";
    return;
  }
  window.location.href = "/" + orgSlug + "/meetings/" + data.run.id;
});

document.querySelector("#refresh-runs").addEventListener("click", loadRuns);
function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}
loadRuns().catch(() => { runList.textContent = "Could not load runs."; });
</script>`,
  })
}

export function renderMeetingRunDetailPage(
  options: MeetingRunDetailPageOptions,
) {
  return pageShell({
    title: "Meeting run",
    body: `<main class="shell" data-org-slug="${escapeHtml(options.orgSlug)}" data-run-id="${escapeHtml(options.runId)}" data-api-base-url="${escapeHtml(options.apiBaseUrl)}">
  <a href="/${escapeHtml(options.orgSlug)}/meetings">Back to meetings</a>
  <section class="panel">
    <div class="status-grid">
      <div>
        <p class="eyebrow">Status</p>
        <h1 id="run-status">Loading</h1>
      </div>
      <div>
        <p class="eyebrow">Provider bot</p>
        <p id="provider-bot-id" class="code">-</p>
      </div>
    </div>
  </section>
  <section class="panel">
    <h2>Live description</h2>
    <p id="live-summary" class="summary">Waiting for meeting state.</p>
    <dl class="facts">
      <div><dt>Topic</dt><dd id="current-topic">-</dd></div>
      <div><dt>Open questions</dt><dd id="open-questions">-</dd></div>
    </dl>
  </section>
  <section class="panel">
    <h2>Transcript</h2>
    <div id="transcript" class="stack"></div>
  </section>
  <section class="panel">
    <h2>Events</h2>
    <div id="events" class="stack"></div>
  </section>
</main>
<script>
const root = document.querySelector("[data-run-id]");
const orgSlug = root.dataset.orgSlug;
const runId = root.dataset.runId;
const apiBaseUrl = root.dataset.apiBaseUrl;

async function loadRun() {
  const response = await fetch(apiBaseUrl + "/api/workspace/" + orgSlug + "/meeting-agent/runs/" + runId);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not load run");
  document.querySelector("#run-status").textContent = data.run.status;
  document.querySelector("#provider-bot-id").textContent = data.run.meetingBaasBotId || "-";
  document.querySelector("#live-summary").textContent = data.latestState?.summary || "Waiting for meeting state.";
  document.querySelector("#current-topic").textContent = data.latestState?.currentTopic || "-";
  document.querySelector("#open-questions").textContent = (data.latestState?.openQuestions || []).join(", ") || "-";
  document.querySelector("#transcript").innerHTML = data.transcriptSegments.map((segment) => '<div class="line"><strong>' + escapeText(segment.speakerName || "Speaker") + '</strong><span>' + escapeText(segment.text) + '</span></div>').join("");
  document.querySelector("#events").innerHTML = data.recentEvents.map((event) => '<div class="line"><strong>' + escapeText(event.eventType) + '</strong><span>' + escapeText(event.source) + '</span></div>').join("");
}

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

loadRun().catch((error) => { document.querySelector("#run-status").textContent = error.message; });
setInterval(() => loadRun().catch(() => {}), 3000);
</script>`,
  })
}

function pageShell(options: { title: string; body: string }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(options.title)}</title>
    <style>
      body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #f7f7f4; color: #171714; }
      .shell { width: min(1040px, calc(100vw - 32px)); margin: 32px auto; display: grid; gap: 16px; }
      .panel { background: #ffffff; border: 1px solid #d8d8d0; border-radius: 8px; padding: 20px; display: grid; gap: 16px; }
      .stack { display: grid; gap: 12px; }
      .eyebrow { margin: 0 0 4px; color: #68685f; font-size: 12px; text-transform: uppercase; letter-spacing: 0; }
      h1, h2, p { margin-top: 0; }
      h1 { font-size: 32px; margin-bottom: 6px; }
      h2 { font-size: 20px; margin-bottom: 0; }
      .muted { color: #68685f; }
      label { display: grid; gap: 6px; font-weight: 600; }
      input, textarea { box-sizing: border-box; width: 100%; border: 1px solid #c9c9bf; border-radius: 6px; padding: 10px 12px; font: inherit; background: #fff; }
      button { width: fit-content; border: 0; border-radius: 6px; padding: 10px 14px; background: #191917; color: #fff; font: inherit; cursor: pointer; }
      .section-title, .status-grid { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .run-row, .line { border: 1px solid #e1e1da; border-radius: 6px; padding: 12px; display: grid; gap: 4px; color: inherit; text-decoration: none; }
      .summary { font-size: 18px; line-height: 1.5; }
      .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin: 0; }
      dt { font-weight: 700; }
      dd { margin: 4px 0 0; color: #46463f; }
      .code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    </style>
  </head>
  <body>${options.body}</body>
</html>`
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char] ?? char,
  )
}
