# Turning Findings Into 3 Options

The review ends with a choice, and the quality of that choice is set by how the options were
built. Options assembled from a fixed menu of themes ("audio", "content", "devops") always
sound reasonable and are frequently disconnected from what the audit actually found — the user
then picks between three guesses. This document is how to avoid that.

---

## 1. Start from the finding list, not from themes

After the audit, you have a list of findings, each with a severity, evidence, and a blast radius.
Group them:

- **Compounding** — gets more expensive the longer it waits (duplicate dictionary entries, each
  emitting a competing `/word/` page; a phonetic map drifting further with every edit).
- **Blocking** — something else can't be done well until it is fixed (an audit tool measuring the
  wrong map means every future pronunciation claim is unreliable).
- **Latent** — real, but no forcing function yet (model ID sprawl, unthrottled endpoint at
  current traffic).
- **Additive** — nothing is broken; there's simply value not yet built (curated terms staged and
  un-ingested, unmapped slang categories).

An option is a coherent bundle of findings from this list plus the work that resolves them.

## 2. Make the three actually different

The user's choice is only meaningful if the options differ along an axis they care about. Pick
the axis from the finding shape:

- **Different domains** — when findings are spread across pillars, one option per cluster.
- **Different depths** — when findings all cluster in one place: *fix the instance* (patch the
  one drifted map) / *fix the class* (extract a shared module both consumers import) / *rebuild
  the mechanism* (move phonetics server-side so every caller benefits). Say explicitly that you
  chose depth as the axis, and why.
- **Different horizons** — ship-this-hour vs. this-week vs. structural, when the user is time-boxed.

Reject any option you cannot trace to at least one finding. Three options is the target, not a
quota to pad: if only two survive, present two and say why the third theme had no evidence
behind it.

## 3. Specify each option so it can be started immediately

Each option needs:

1. **Title** — what gets done, not a category name.
2. **Why now** — the finding(s) it resolves, quoted with their evidence.
3. **Deliverables** — 3-4 items naming real files, tables, or commands.
4. **Effort** — Low (< 1h) / Medium (1-3h) / High (multi-session), with the driver of the estimate.
5. **Verification** — the command or observation that will prove it worked. An option whose
   success can't be checked isn't ready to offer.

Recommend one, and justify the recommendation by severity or user impact — not by whichever is
easiest. If a FAIL exists, the recommendation addresses it or explains why something else
outranks it.

## 4. Worked example

> **Finding (WARN, elevenlabs):** the phonetic maps in
> `src/components/speech/elevenlabs-speech.js` (303 mappings) and
> `tools/testing/pronunciation-audit.js` (293) have drifted by 10 mappings, so the audit tool
> scores a map users never hear.
> **Finding (WARN, elevenlabs):** `routes/tts.js` forwards `req.body.text` verbatim — phonetics
> are applied client-side only.

These two findings support three genuinely different options along the depth axis:

- **Fix the instance** — copy the 10 missing mappings into the audit tool. Low effort; the drift
  returns on the next edit.
- **Fix the class** — extract `src/components/speech/pronunciation-map.js`, import it in both
  places, add a CI assertion that they can't diverge. Medium; kills the whole failure mode.
- **Rebuild the mechanism** — apply substitution inside `routes/tts.js` so pre-generation and any
  server-side caller get local pronunciation too, keying the cache on post-substitution text.
  High; changes cache keys, so it needs a cache migration plan.

Verification, respectively: rerun the audit and confirm zero drift / same, plus a deliberately
broken map fails CI / pre-generate one term and confirm the produced audio matches browser playback.

## 5. Presenting the choice

Claude Code uses `AskUserQuestion` (arrow keys + Enter, "Other" is always available):

```json
{
  "questions": [{
    "question": "Which improvement should I take on next?",
    "header": "Next work",
    "multiSelect": false,
    "options": [
      { "label": "Extract a shared pronunciation map (Recommended)",
        "description": "Ends the 10-mapping drift between the runtime engine and the audit tool. Medium, ~2h." },
      { "label": "Ingest the staged curated terms",
        "description": "Ships terms already written and sitting unused, plus page/sitemap regeneration. Low, ~1h." },
      { "label": "Move phonetics server-side into routes/tts.js",
        "description": "Every caller gets local pronunciation; needs an audio cache migration. High." }
    ]
  }]
}
```

Under Antigravity the equivalent call is `ask_question` with `is_multi_select: false` and plain
string options.

After the selection, execute the chosen option in full and run the verification you promised.
