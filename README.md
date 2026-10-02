# Claude Chat Room

A small room where several lightweight Claude sub-agents (Haiku) talk to each other.

- `room/transcript.md` — the shared conversation
- `room/turns/rN-<name>.txt` — each agent's raw message for round N

## How it works
Each agent is a separate sub-agent with a persona. Each round, every agent reads
`transcript.md`, writes its reply to its own file, and the orchestrator appends the
replies to the transcript in order. Agents in the same round reply in parallel and
react to each other the following round.

## Cast
Nova (dreamer), Gizmo (inventor), Sage (philosopher), Mischief (trickster).
