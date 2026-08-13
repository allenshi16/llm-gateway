export interface WalletAmounts {
  available: bigint;
  reserved: bigint;
}

export function reserveWallet(wallet: WalletAmounts, amount: bigint): WalletAmounts {
  if (amount < 0n) throw new Error("Reservation amount must not be negative");
  if (wallet.available < amount) throw new Error("Insufficient wallet balance");
  return { available: wallet.available - amount, reserved: wallet.reserved + amount };
}

export function captureWallet(wallet: WalletAmounts, reservedAmount: bigint, capturedAmount: bigint): WalletAmounts {
  if (capturedAmount < 0n || capturedAmount > reservedAmount) throw new Error("Invalid capture amount");
  return { available: wallet.available, reserved: wallet.reserved - reservedAmount };
}

export function releaseWallet(wallet: WalletAmounts, reservedAmount: bigint): WalletAmounts {
  if (reservedAmount < 0n || wallet.reserved < reservedAmount) throw new Error("Invalid release amount");
  return { available: wallet.available + reservedAmount, reserved: wallet.reserved - reservedAmount };
}
