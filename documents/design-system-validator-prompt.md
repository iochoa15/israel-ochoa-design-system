# Validator Prompt — Audit Token Output

You are validating generated design token artifacts against a strict contract.

## Inputs

You receive:
1. `design-tokens.json`
2. `design-tokens-usage-guide.md`

## Output Format

Return three sections only:
1. `PASS_FAIL`: PASS or FAIL
2. `FINDINGS`: numbered list, highest severity first
3. `FIX_PLAN`: concise remediation steps mapped to findings

If no issues, explicitly say "No blocking issues found" and include any minor recommendations.

## Blocking Validation Rules

Fail if any rule is broken:

1. Root collections missing: `brand`, `alias`, `mapped`, `responsive`, `meta`.
2. Missing required token fields: `$value`, `$type`, `$description`.
3. Immutable source anchors altered or missing:
   - `#E54633`, `#8CC8DB`, `#FCFCD4`, `#FDFDFD`, `#F6F5E9`, `#EEEDEB`, `#242424`, `#333333`, `#5D8DF7`, `#A6ACC6`, `#CDD2EB`.
4. Alias token contains raw hex.
5. Mapped token references brand directly.
6. Missing mapped light/dark modes.
7. Missing responsive desktop/mobile modes.
8. Body/caption sizes differ between desktop and mobile.
9. Missing required mapped categories or interaction states.
10. Generated colors not marked (`generated: true` metadata).
11. Missing `meta.audit` fields:
    - input_anchors_confirmed
    - generated_color_count
    - reference_chain_validation
    - wcag_failures
12. Any unresolved broken reference chain.

## Reference Chain Checks

Validate all mapped references are:
- direct to alias OR mode-aware alias tokens
- transitively resolvable to brand

Flag:
- dead references
- circular references
- cross-tier skips

## Accessibility Checks

Audit intended pairings (light and dark):
- text tokens on surface tokens
- icon tokens on surface tokens
- on-color tokens on action/secondary/status surfaces

WCAG policy:
- Use AA thresholds
- Do not auto-correct; report failures in findings

## Usage Guide Checks

Fail if the guide does not clearly explain:
- surface token usage (page/default/elevated/glass/gradient)
- text token usage (heading/hero/body/caption)
- glass CSS implementation details
- gradient CSS application patterns
- plasticine integration guidance
- border-radius philosophy
- typography pairings rationale
- light vs dark behavior
- responsive behavior
- primary vs secondary vs tertiary usage

## Severity Model

Use:
- `P0` invalid architecture or broken exports
- `P1` semantic correctness or accessibility risks
- `P2` documentation or clarity gaps

Prioritize by severity, then breadth of impact.

