import { fairCoinService } from '../services/fairCoinService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const getWallet = asyncWrapper(async (req, res) => {
  const wallet = await fairCoinService.getOrCreateWallet(req.user._id);
  return res.status(200).json(new ApiResponse(200, { wallet }, 'Fair Coins wallet balance retrieved'));
});

export const getTransactions = asyncWrapper(async (req, res) => {
  const result = await fairCoinService.getTransactions(req.user._id, req.query);
  return res.status(200).json(new ApiResponse(200, result, 'Fair Coins ledger transactions retrieved'));
});

export const getFairCoinSettings = asyncWrapper(async (req, res) => {
  const maxCoinsPerPurchase = await fairCoinService.getMaxCoinsPerPurchase();
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        maxCoinsPerPurchase,
        coinsPerRupee: 10,
        conversionText: '10 Fair Coins = ₹1',
      },
      'Fair Coins settings retrieved successfully'
    )
  );
});
