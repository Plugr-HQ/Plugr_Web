# Skills Assessment: Meeting Time (Frontend Handoff)

**Screen to update:** `src/components/plug/SkillsAssessmentScreen.tsx`
**Backend status:** done and pushed. This doc covers what changed and what the page must do about it.

---

## 1. What changed, in one paragraph

Before, a Plug picking "Request assessment call" just tapped a button and ops rang them to agree a time by hand. Now the Plug **proposes a preferred date and time** when they request the call. Ops confirm that slot (or agree another) and the Plug is told on WhatsApp. The page's job is to collect the proposed time, send it, and then show the right status afterwards: first the time they asked for, then the time ops confirmed.

**Important:** the time the Plug picks is a *request*, not a booking. The page copy must never imply the slot is locked in until `confirmedTime` is set.

---

## 2. Endpoints the page uses

The backend routes below are the Nest routes. The page reaches them through its existing API layer (`apiFetch` and the `/api/plug/verification/...` path the screen already uses). Confirm that layer forwards the request body and the new response fields unchanged. If it strips unknown fields, that is where the work is.

### 2.1 Read the current state: `GET /verification/items`

Already used by `loadVerificationSnapshot`. The `skills` block now has **two new fields**:

```json
{
  "skills": {
    "state": "pending_review",
    "path": "CALL",
    "requestedAt": "2026-10-01T09:12:44.000Z",
    "meetingTime": "2026-10-03T14:00:00.000Z",
    "confirmedTime": null,
    "reviewNote": null
  }
}
```

| Field | Type | Meaning |
|---|---|---|
| `state` | `not_started` \| `in_progress` \| `pending_review` \| `verified` | Same as before. |
| `path` | `"CALL"` \| `"VOICE_NOTE"` \| `null` | Same as before. |
| `requestedAt` | ISO string \| null | When the Plug tapped the button. Same as before. |
| **`meetingTime`** | ISO string \| null | **New.** The time the Plug *asked for*. `null` for voice notes and for older requests made before this change. |
| **`confirmedTime`** | ISO string \| null | **New.** The slot ops *confirmed*. `null` until ops confirm. |
| `reviewNote` | string \| null | Same as before. Only present when ops sent it back. |

Notes:

- Both new fields arrive as **ISO 8601 UTC strings** (they are serialised dates). Add them to the `skills` type in `verificationItems`.
- Both are `null` when the Plug hasn't started. Handle `null` everywhere.
- Older call requests (made before this change) have `meetingTime: null` even though `path` is `CALL`. The pending screen must not crash or show "Invalid Date" for those.

### 2.2 Submit the choice: `POST /verification/skills`

The screen already calls this. The **request body gains one optional field**.

**Request body**

```json
{ "path": "CALL", "meetingTime": "2026-10-03T14:00:00.000Z" }
```

```json
{ "path": "VOICE_NOTE" }
```

| Field | Rules |
|---|---|
| `path` | Required. `"CALL"` or `"VOICE_NOTE"`. |
| `meetingTime` | **Required when `path` is `CALL`.** Ignored when `path` is `VOICE_NOTE`. Must be an ISO 8601 timestamp **with a timezone offset** (`Z` or `+01:00`). A bare `2026-10-03T15:00` is rejected. |

**Server-side rules for `meetingTime`** (the page should pre-empt these, but the server is the authority):

- At least **30 minutes** in the future.
- No more than **30 days** in the future.
- Must be a real date.

**Recommended page limits:** 1 hour minimum lead (gives ops time to react) and a 30-day maximum on the picker. Both are stricter than the server on purpose, so a valid pick never bounces because of clock drift between the phone and the server.

**Success response** (HTTP 200)

```json
{ "state": "pending_review", "path": "CALL", "meetingTime": "2026-10-03T14:00:00.000Z" }
```

For a voice note, `meetingTime` is `null`. After a successful response, reload the snapshot (as the page does today) rather than trusting the response alone.

**Error responses** (HTTP 400)

| Situation | Message the server returns |
|---|---|
| `CALL` with no time | `Pick a date and time for your call.` |
| Malformed or offset-less time | `Pick a date and time for your call.` |
| Time not a real date | `That date and time doesn’t look right.` |
| Under 30 minutes away or in the past | `Pick a time at least 30 minutes from now.` |
| More than 30 days out | `Pick a time within the next 30 days.` |

**Watch out: the error `message` can be a string or an array of strings.** Validation failures caught by the request validator come back as an array, while the service's own checks come back as a single string. The page's error handling must handle both, or the Plug sees `[object Object]` or an empty message.

**Side effects (no frontend action needed):** a successful `CALL` request sends an alert to the ops Telegram chat with the Plug's name, phone, trade and the requested time in Lagos time.

**Re-submitting:** a Plug can submit again. That overwrites the earlier time, **clears any `confirmedTime`**, and pages ops again. Picking `VOICE_NOTE` after a call request clears the saved `meetingTime`. So the page should always trust the latest snapshot, never a cached time.

---

## 3. Endpoint the page does NOT use (for context)

### `PATCH /admin/verification/skills/:plugId/schedule` (ops only)

This is how ops confirm the slot. It is **admin-only** (an ADMIN token is required; a Plug token gets refused) and belongs to the admin dashboard, not this screen.

```json
{ "confirmedTime": "2026-10-03T14:00:00+00:00" }
```

What it does: stores `confirmedTime`, then sends the Plug a WhatsApp confirmation. It does **not** change `state`. The item stays `pending_review` until ops pass or fail the assessment after the call. Confirming again replaces the time and re-notifies the Plug.

Why the Plug-facing frontend cares: the moment ops call this, the next snapshot returns a non-null `confirmedTime`. That's the signal to switch the pending screen from "preferred time" to "confirmed".

*(A "Confirm time" control in the admin verification view still needs building. That is a separate task from this screen. The admin detail endpoint `GET /admin/verification/:plugId` now returns `meetingTime` and `confirmedTime` inside its `skills` block to support it.)*

---

## 4. What the page has to do

### 4.1 The call option (not started, or sent back)

- Collect a **preferred date and time** before allowing the request. It is required for calls.
- Validate it on the page: present, a real date, in the future by your minimum lead, within 30 days.
- Send it as a **UTC ISO string** (convert the picked local time with `toISOString()`).
- Show the timezone next to the picker. The Plugs are in Lagos, so label it **Lagos time (WAT)**.
- The voice-note option is unchanged and sends no time.
- Update the call option's copy so it says the Plug is choosing a time that ops will **confirm on WhatsApp** and then ring them.

### 4.2 The pending screen (`state === 'pending_review'`)

Three cases for a call request, driven by the snapshot:

| Snapshot | What to show |
|---|---|
| `path: CALL`, `confirmedTime` set | The **confirmed** time, worded as confirmed (for example "Confirmed for Sat 3 Oct, 3:00 PM"). Tell them to keep their phone close and that ops will ring them. |
| `path: CALL`, `confirmedTime` null, `meetingTime` set | The **requested** time, worded as a request (for example "Your preferred time"). Tell them ops will confirm it on WhatsApp. |
| `path: CALL`, both null | Older request with no time. Show the generic "call requested, we'll confirm on WhatsApp" message with no time line. |

If `confirmedTime` is set it wins over `meetingTime`. Voice-note and verified screens are unchanged.

### 4.3 Display timezone

Always **render times in Africa/Lagos**, never in the browser's timezone. A Plug on a phone set to another zone should still see Lagos time, because that is the time ops will ring them. Label it WAT. Lagos has no daylight saving, so it is always UTC+1.

---

## 5. Behaviour cheat-sheet

- The backend stores everything in **UTC**. The page converts on the way in (local pick to UTC ISO) and on the way out (UTC ISO to Lagos display).
- **`meetingTime` = what the Plug asked for. `confirmedTime` = what ops agreed.** They can differ. Ops may agree a different time by phone, and that is fine.
- Resubmitting clears the confirmation, so a stale "Confirmed for..." can only appear if the page caches the old snapshot.
- The WhatsApp confirmation to the Plug depends on a Meta template that may still be pending approval. Until it's approved, ops phone the Plug themselves. That's invisible to this screen, but it means `confirmedTime` can be set while the Plug has not had a WhatsApp yet.

---

## 6. Test checklist

- [ ] Request a call with a valid time. The pending screen shows the requested time in Lagos time.
- [ ] Request a call with no time. The page blocks it with a clear message before calling the API.
- [ ] Bypass the page check (a time in the past). The server's 400 message is shown cleanly, whether it arrives as a string or an array.
- [ ] Choose a voice note. No time is sent and none is shown afterwards.
- [ ] Ops confirm a time (admin endpoint or Postman). Reload. The screen shows the confirmed time, worded as confirmed.
- [ ] Re-request with a new time after a confirmation. The screen goes back to the requested time, with no leftover confirmation.
- [ ] An older call request with `meetingTime: null`. The screen renders without errors and without "Invalid Date".
- [ ] Change the device timezone. The displayed time stays in Lagos time.
- [ ] Slow or offline network. The submit button shows loading, does not double-submit, and the error is readable.

---

## 7. Where to ask

Anything about the API behaviour, the exact error strings, or the admin side: ask Phantom before guessing. The rules in this document come straight from the backend code (`verification-items.service.ts` and `verification-items.dto.ts`).
