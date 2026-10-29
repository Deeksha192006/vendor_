/**
 * BAAPOO MART — Authoritative Fair Coin Business Rules
 *
 * The Fair Coin conversion rate is permanently fixed:
 * 10 Fair Coins = ₹1
 * 1 Fair Coin = ₹0.10
 *
 * This rule is immutable across the platform and cannot be overridden by database settings or user input.
 */

export const FAIR_COIN_CONVERSION = Object.freeze({
  COINS_PER_RUPEE: 10,
  RUPEES_PER_COIN: 0.1,
  CONVERSION_TEXT: '10 Fair Coins = ₹1',

  /**
   * Calculate rupee equivalent of Fair Coins with standard 2-decimal currency rounding.
   * e.g. 10 coins -> ₹1.00, 50 coins -> ₹5.00, 500 coins -> ₹50.00
   */
  toRupees: (coins) => {
    const numCoins = Math.max(0, Number(coins) || 0);
    return Math.round((numCoins / 10) * 100) / 100;
  },

  /**
   * Calculate Fair Coins required for a given rupee amount.
   * e.g. ₹1 -> 10 coins, ₹10 -> 100 coins
   */
  toCoins: (rupees) => {
    const numRupees = Math.max(0, Number(rupees) || 0);
    return Math.round(numRupees * 10);
  },
});

export default FAIR_COIN_CONVERSION;
