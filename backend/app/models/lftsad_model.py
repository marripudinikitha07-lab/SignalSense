import torch
import torch.nn as nn
import torch.nn.functional as F
from einops import rearrange
from .revin import RevIN

class MLP(nn.Module):
    def __init__(self, input_size: int, hidden_size: int, output_size: int):
        super(MLP, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

class LFTSAD(nn.Module):
    """
    Lightweight and Fast Time-Series Anomaly Detection (LFTSAD)
    via Point-Level and Sequence-Level Reconstruction Discrepancy.
    """
    def __init__(
        self,
        win_size: int = 60,
        enc_in: int = 24,
        c_out: int = 24,
        d_model: int = 64,
        patch_size: list = None,
        patch_seq: list = None,
        seq_size: int = 5,
        channel: int = 24,
        output_attention: bool = True,
    ):
        super(LFTSAD, self).__init__()
        if patch_size is None:
            patch_size = [6]
        if patch_seq is None:
            patch_seq = [6]

        self.output_attention = output_attention
        self.patch_size = patch_size
        self.channel = channel
        self.win_size = win_size
        self.patch_seq = patch_seq
        self.seq_size = seq_size

        mlp_num_input_size = [self.win_size // patchsize - 1 for patchsize in self.patch_size]
        mlp_num_seq_input_size = [self.win_size // patch_seq_val - self.seq_size for patch_seq_val in self.patch_seq]

        # Point-level MLPs (intra-patch size and inter-patch count)
        self.mlp_size = nn.ModuleList(
            MLP(patchsize - 1, d_model, 1) for patchsize in self.patch_size
        )
        self.mlp_num = nn.ModuleList(
            MLP(input_size, d_model, 1) for input_size in mlp_num_input_size
        )

        # Sequence-level MLPs (contextual patch representation)
        self.mlp_size_seq = nn.ModuleList(
            MLP((patch_seq_val - 1) * self.seq_size, d_model, self.seq_size) for patch_seq_val in self.patch_seq
        )
        self.mlp_num_seq = nn.ModuleList(
            MLP(input_size, d_model, self.seq_size) for input_size in mlp_num_seq_input_size
        )

    def forward(self, x):
        # x shape: (B, L, M) -> Batch, Window Length, Channels
        B, L, M = x.shape
        series_patch_mean = []
        prior_patch_mean = []

        revin_layer = RevIN(num_features=M)
        x_norm = revin_layer(x, 'norm')

        # 1. Point-Level Reconstruction
        for patch_index, patchsize in enumerate(self.patch_size):
            # Intra-patch size branch
            x_patch_size = rearrange(x_norm, 'b l m -> b m l')
            x_patch_size = rearrange(x_patch_size, 'b m (p n) -> (b m) p n', p=patchsize)
            result = []
            all_indices = list(range(patchsize))
            for i in range(patchsize):
                indices = [idx for idx in all_indices if idx != i]
                temp1 = x_patch_size[:, indices, :].permute(0, 2, 1)
                result.append(temp1)
            x_patch_size = torch.cat(result, axis=1).permute(1, 0, 2)
            x_patch_size = self.mlp_size[patch_index](x_patch_size).squeeze(-1).permute(1, 0).reshape(-1, self.channel, self.win_size).permute(0, 2, 1)

            # Inter-patch num branch
            num = self.win_size // patchsize
            x_patch_num = rearrange(x_norm, 'b l m -> b m l')
            x_patch_num = rearrange(x_patch_num, 'b m (p n) -> (b m) p n', p=patchsize)
            result = []
            for i in range(L):
                part = torch.cat((x_patch_num[:, i % patchsize, 0 : i // patchsize], x_patch_num[:, i % patchsize, i // patchsize + 1 : num]), dim=1)
                result.append(part)
            x_patch_num = torch.cat(result, axis=0)
            x_patch_num = self.mlp_num[patch_index](x_patch_num)
            x_patch_num = x_patch_num.reshape(B, M, L).permute(0, 2, 1)

            series_patch_mean.append(x_patch_size)
            prior_patch_mean.append(x_patch_num)

        # 2. Sequence-Level Reconstruction
        series_patch_seq = []
        prior_patch_seq = []
        for patch_index, patchsize in enumerate(self.patch_seq):
            x_patch_size = rearrange(x_norm, 'b l m -> b m l')
            x_patch_size = rearrange(x_patch_size, 'b m (p n s) -> (b m) p n s', p=patchsize, s=self.seq_size)
            result = []
            all_indices = list(range(patchsize))
            for i in range(patchsize):
                indices = [idx for idx in all_indices if idx != i]
                temp1 = rearrange(x_patch_size[:, indices, :, :].permute(0, 2, 1, 3), 'a b c d -> a b (c d)')
                result.append(temp1)
            x_patch_size = torch.cat(result, axis=1)
            x_patch_size = rearrange(self.mlp_size_seq[patch_index](x_patch_size), '(a b) c d -> a b (c d)', b=self.channel).permute(0, 2, 1)

            x_patch_num = rearrange(x_norm, 'b l m -> b m l')
            x_patch_num = rearrange(x_patch_num, 'b m (p n s) -> (b m) p n s', p=patchsize, s=self.seq_size)
            result = []
            for i in range(x_patch_num.shape[2]):
                indices = [idx for idx in range(x_patch_num.shape[2]) if idx != i]
                temp1 = rearrange(x_patch_num[:, :, indices, :], 'a b c d -> a b (c d)')
                result.append(temp1)
            x_patch_num = torch.cat(result, axis=1)
            x_patch_num = self.mlp_num_seq[patch_index](x_patch_num)
            x_patch_num = rearrange(
                rearrange(x_patch_num, '(a b) (c d) e -> a b c d e', b=self.channel, d=self.patch_seq[0]).permute(0, 1, 3, 2, 4),
                'a b c d e -> a b (c d e)'
            ).permute(0, 2, 1)

            series_patch_seq.append(x_patch_size)
            prior_patch_seq.append(x_patch_num)

        if self.output_attention:
            return series_patch_mean, prior_patch_mean, series_patch_seq, prior_patch_seq
        return None
