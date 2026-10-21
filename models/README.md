# SignalSense Model Checkpoints Directory

## Stored Checkpoints
- `lftsad_baseline.pt`: PyTorch weights for the trained LFTSAD architecture on SWAN-SF normal quiet regions.
  - Architecture: RevIN + Dual MLP Encoders
  - Input dimension: `win_size=60`, `channel=24`, `d_model=64`
  - Patch configuration: `patch_size=[6]`, `patch_seq=[6]`, `seq_size=5`
