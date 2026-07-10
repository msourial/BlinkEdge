#!/usr/bin/env bash
set -euo pipefail

echo "=== BlinkEdge SPL Hedge Vault Setup ==="
echo ""
echo "This script creates a devnet SPL token mint and vault keypair"
echo "for the real SPL hedge voucher (Phase 4)."
echo "It requires the Solana CLI tools installed."
echo ""

# 1. Create vault keypair
VAULT_KEY=".spl-vault-keypair.json"
if [ -f "$VAULT_KEY" ]; then
  echo "[SKIP] Vault keypair already exists at $VAULT_KEY"
else
  echo "[CREATE] Vault keypair..."
  solana-keygen new --no-bip39-passphrase -o "$VAULT_KEY" --force
  echo "[OK] Vault keypair created"
fi

VAULT_PUBKEY=$(solana-keygen pubkey "$VAULT_KEY")
echo "  Vault public key: $VAULT_PUBKEY"

# 2. Fund vault with devnet SOL
BALANCE=$(solana balance "$VAULT_PUBKEY" --url devnet 2>/dev/null || echo "0 SOL")
echo "  Vault balance: $BALANCE"
if [[ "$BALANCE" == "0 SOL" ]]; then
  echo "[AIRDROP] Funding vault with 2 devnet SOL..."
  solana airdrop 2 "$VAULT_PUBKEY" --url devnet
  echo "[OK] Vault funded"
fi

# 3. Create SPL token mint
MINT_KEY=".spl-mint-keypair.json"
if [ -f "$MINT_KEY" ]; then
  echo "[SKIP] Mint keypair already exists at $MINT_KEY"
else
  echo "[CREATE] SPL token mint (decimals: 9)..."
  spl-token create-token --decimals 9 --url devnet --output json > /dev/null 2>&1 || {
    # Fallback: create manually
    solana-keygen new --no-bip39-passphrase -o "$MINT_KEY" --force
    echo "  Mint keypair created. You still need to create the token:"
    echo "  spl-token create-token --url devnet --mint-authority $VAULT_PUBKEY $MINT_KEY"
  }
fi

# Read mint address from keypair if it exists
if [ -f .spl-mint-address.txt ]; then
  MINT_ADDRESS=$(cat .spl-mint-address.txt)
else
  # Try to find existing token accounts
  MINT_ADDRESS=$(spl-token create-token --decimals 9 --url devnet 2>&1 | grep "Creating token" | awk '{print $NF}')
  if [ -n "$MINT_ADDRESS" ]; then
    echo "$MINT_ADDRESS" > .spl-mint-address.txt
  fi
fi

if [ -z "${MINT_ADDRESS:-}" ]; then
  echo "[WARN] Could not determine mint address."
  echo "  Please create the token manually: spl-token create-token --decimals 9 --url devnet"
  echo "  Then save the mint address to .spl-mint-address.txt"
  MINT_ADDRESS="<SET_ME>"
fi
echo "  Mint address: $MINT_ADDRESS"

# 4. Create vault's associated token account
echo "[CREATE] Vault ATA..."
spl-token create-account "$MINT_ADDRESS" --owner "$VAULT_PUBKEY" --url devnet 2>/dev/null || echo "  (ATA may already exist)"

# 5. Mint tokens to vault
echo "[MINT] Minting 1000000 tokens to vault..."
spl-token mint "$MINT_ADDRESS" 1000000 --owner "$VAULT_PUBKEY" --url devnet 2>/dev/null || echo "  (mint may already exist or authority differs)"

# 6. Export env vars
echo ""
echo "=== Env Vars ==="
VAULT_SECRET_B64=$(cat "$VAULT_KEY" | node -e "process.stdin.resume(); let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>console.log(Buffer.from(JSON.parse(d)).toString('base64'))))")
echo "SPL_HEDGE_MINT_ADDRESS=$MINT_ADDRESS"
echo "SPL_VAULT_SECRET_KEY=$VAULT_SECRET_B64"
echo ""
echo "Add these to your .env.local file:"
echo ""
echo "SPL_HEDGE_MINT_ADDRESS=$MINT_ADDRESS"
echo "SPL_VAULT_SECRET_KEY=$VAULT_SECRET_B64"
echo ""
echo "For Render, add these via the dashboard or render.yaml."
echo "Done."
