Add-Lead Lambda

Endpoint: POST to the Function URL (or API Gateway endpoint)

Expected JSON body:

- `name` (string) — required
- `clase` or `class` (string) — required (class they want to take)
- `phone` (string) — required
- `visit_date` (string) — optional (date for trial class)
- `note` (string) — optional
- `uniform` (boolean) — optional

Security: set `ELEVENLABS_WEBHOOK_SECRET` in env and ElevenLabs tool must send header `Authorization: Bearer <secret>`.

Example curl:

```bash
curl -X POST <FUNCTION_URL> \
  -H "Authorization: Bearer $ELEVENLABS_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Perez","clase":"Karate Kids","phone":"+521234567890","visit_date":"2026-03-01","note":"Ya tiene uniforme","uniform":true}'
```
