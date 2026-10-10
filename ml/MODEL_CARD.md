# Model card

_Fill in when the first model ships._

| | |
|---|---|
| Sign language | TBD |
| Classes | `shared/labels.json` version … |
| Input | 126 features per frame (`shared/feature-spec.md`), or 30 × 126 for words |
| Architecture | … |
| Training data | datasets + own recordings (signers, sessions) |
| Split | by signer |
| Validation accuracy (held-out signers) | … |
| Live accuracy (demo setup) | … |
| Known failure cases | e.g. similar letters (M/N/S/T), low light, hand at frame edge |

## Limitations

Fingerspelling and a small fixed vocabulary only. Not a sign language translator.
