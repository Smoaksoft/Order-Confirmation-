# Testing Strategy: OrderVoice AI

OrderVoice AI enforces extensive testing across all modules to maintain highly accurate voice call automation and real-time natural conversations.

## 1. Automated Test Suites

### Unit Tests
Validate functional schemas, validation helpers, and routing logic:
```bash
# Example commands
npm test
# runs jest on /src/__tests__/
```

Key targets:
- JWT payload sign-in / roles assertion
- CSV Parser validations for bad column offsets
- System language detection algorithms (English vs. Hindi vs. Bengali)

### Integration Tests
Verify data consistency across API boundary and database writes:
```bash
# Test API router behaviors with mock server sessions
npm run test:integration
```
Key targets:
- `/api/orders` status updates on voice simulation completion
- Plan limits enforcement during bulk scheduler triggers

## 2. AI Prompt Evaluation & Intent Guardrails
Since OrderVoice AI coordinates dynamic customer orders via Gemini:
1. **Regression Testing**: Validate system prompt changes against typical transcripts.
2. **Intent Assertions**: Confirm customer statements containing "confirm, haa, haan, yes, go ahead" accurately trigger `'intent': 'confirmed'`.
3. **Escalation Coverage**: Verify offensive feedback, unresolved complaints, or human transfer requests ("get real person", "transfer to manager") flag `escalationRequired: true` immediately.

## 3. High-Throughput Load Testing (SLA Requirements)
Because the application must support thousands of calls:
- **Mock Testing with k6**:
  ```javascript
  import http from 'k6/http';
  export default function () {
    http.get('https://ordervoice.ai/api/analytics/dashboard');
  }
  ```
- **Redis Queue Load Assertions**: Validate worker queues can digest up to 50 concurrent outbound call triggers per second.
