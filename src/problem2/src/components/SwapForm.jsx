import React, { useState, useEffect } from "react";
import "./SwapForm.css";

const TOKEN_ICON_BASE =
  "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens";
const PRICES_API = "https://interview.switcheo.com/prices.json";

// Common tokens to display
const COMMON_TOKENS = [
  "SWTH",
  "ETH",
  "BTC",
  "USDC",
  "USDT",
  "BNB",
  "SOL",
  "AVAX",
  "MATIC",
  "ADA",
];

function SwapForm() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fromToken, setFromToken] = useState("SWTH");
  const [toToken, setToToken] = useState("ETH");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [errors, setErrors] = useState({});
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, []);

  useEffect(() => {
    // Check if tokens have prices and show error immediately
    if (fromToken && toToken && (!prices[fromToken] || !prices[toToken])) {
      const missingTokens = [];
      if (!prices[fromToken]) missingTokens.push(fromToken);
      if (!prices[toToken]) missingTokens.push(toToken);

      setErrors({
        general: `Price information not available for selected tokens${
          missingTokens.length > 0 ? ` (${missingTokens.join(", ")})` : ""
        }. Please select different tokens.`,
      });
      setToAmount("");
      return;
    }

    // Clear general error if prices are available
    setErrors((prev) => {
      if (
        prev.general === "Price information not available for selected tokens"
      ) {
        const { general, ...rest } = prev;
        return rest;
      }
      return prev;
    });

    if (fromAmount && prices[fromToken] && prices[toToken]) {
      // Correct formula:
      // 1. Calculate USD value of fromAmount: fromAmount × fromTokenPrice
      // 2. Divide by toTokenPrice to get toAmount
      // This ensures the USD value remains the same
      const usdValue = parseFloat(fromAmount) * parseFloat(prices[fromToken]);
      const calculated = (usdValue / parseFloat(prices[toToken])).toFixed(6);
      setToAmount(calculated);
    } else if (!fromAmount) {
      setToAmount("");
    }
  }, [fromAmount, fromToken, toToken, prices]);

  const fetchPrices = async () => {
    try {
      const response = await fetch(PRICES_API);
      const data = await response.json();

      // Handle both array and object formats
      let priceMap = {};

      if (Array.isArray(data)) {
        // If data is an array, convert to object
        // Format: [{currency: 'ETH', price: 1645.93, date: '...'}, ...]
        data.forEach((item) => {
          if (item && item.currency && typeof item.price === "number") {
            // Use the latest price if there are duplicates
            if (
              !priceMap[item.currency] ||
              new Date(item.date) > new Date(priceMap[item.currency].date || 0)
            ) {
              priceMap[item.currency] = item.price;
            }
          }
        });
      } else if (typeof data === "object" && data !== null) {
        // If data is already an object, use it directly
        priceMap = data;
      }

      setPrices(priceMap);
      console.log("Token prices loaded:", priceMap);
      console.log("Available tokens:", Object.keys(priceMap));
      console.log("SWTH price:", priceMap["SWTH"]);
      console.log("ETH price:", priceMap["ETH"]);
    } catch (error) {
      console.error("Error fetching prices:", error);
      setErrors({
        general: "Failed to load token prices. Please refresh the page.",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateInput = (value) => {
    if (!value || value === "") {
      return "Amount is required";
    }
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return "Amount must be a positive number";
    }
    if (num > 1000000) {
      return "Amount is too large";
    }
    return null;
  };

  const handleFromAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFromAmount(value);
      const error = validateInput(value);
      setErrors((prev) => ({ ...prev, fromAmount: error }));
    }
  };

  const handleSwapTokens = () => {
    // Swap tokens
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);

    // Swap amounts to maintain USD value
    // The old toAmount becomes the new fromAmount
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    // toAmount will be recalculated automatically by useEffect
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fromError = validateInput(fromAmount);
    if (fromError) {
      setErrors({ fromAmount: fromError });
      return;
    }

    if (!prices[fromToken] || !prices[toToken]) {
      setErrors({
        general: "Price information not available for selected tokens",
      });
      return;
    }

    if (fromToken === toToken) {
      setErrors({ general: "Cannot swap the same token" });
      return;
    }

    setSubmitting(true);
    setErrors({});

    // Simulate backend interaction
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setSubmitting(false);
    alert(
      `Swap successful! You will receive ${toAmount} ${toToken} for ${fromAmount} ${fromToken}`
    );

    // Reset form
    setFromAmount("");
    setToAmount("");
  };

  const getAvailableTokens = () => {
    return COMMON_TOKENS.filter((token) => prices[token]);
  };

  const getTokenIcon = (token) => {
    return `${TOKEN_ICON_BASE}/${token}.svg`;
  };

  const TokenSelector = ({ value, onChange, onClose, isOpen }) => {
    const availableTokens = getAvailableTokens();

    return (
      <div className={`token-dropdown ${isOpen ? "open" : ""}`}>
        {availableTokens.map((token) => (
          <div
            key={token}
            className="token-option"
            onClick={() => {
              onChange(token);
              onClose();
            }}
          >
            <img
              src={getTokenIcon(token)}
              alt={token}
              className="token-icon-small"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <span>{token}</span>
            {prices[token] && (
              <span className="token-price">
                ${parseFloat(prices[token]).toFixed(2)}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="swap-card">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading token prices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="swap-card">
      <h1 className="swap-title">Swap</h1>

      {errors.general && (
        <div className="error-message general-error">{errors.general}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="swap-section">
          <label className="swap-label">Amount to send</label>
          <div className="input-group">
            <div className="token-selector-container">
              <button
                type="button"
                className="token-select-button"
                onClick={() => {
                  setShowFromDropdown(!showFromDropdown);
                  setShowToDropdown(false);
                }}
              >
                <img
                  src={getTokenIcon(fromToken)}
                  alt={fromToken}
                  className="token-icon"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <span>{fromToken}</span>
                <svg
                  className="dropdown-arrow"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2 4L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <TokenSelector
                value={fromToken}
                onChange={setFromToken}
                onClose={() => setShowFromDropdown(false)}
                isOpen={showFromDropdown}
              />
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                className={`amount-input ${errors.fromAmount ? "error" : ""}`}
                value={fromAmount}
                onChange={handleFromAmountChange}
                placeholder="0.0"
                disabled={submitting}
              />
              {prices[fromToken] ? (
                <span className="usd-value">
                  ≈ $
                  {(() => {
                    const usdValue =
                      parseFloat(fromAmount || 0) *
                      parseFloat(prices[fromToken]);
                    // If value is very small (< 0.01), show more decimal places
                    if (usdValue > 0 && usdValue < 0.01) {
                      return usdValue.toFixed(6);
                    }
                    return usdValue.toFixed(2);
                  })()}{" "}
                  USD
                </span>
              ) : fromToken && fromAmount ? (
                <span className="usd-value" style={{ color: "#ef4444" }}>
                  Price not available for {fromToken}
                </span>
              ) : null}
            </div>
          </div>
          {errors.fromAmount && (
            <div className="error-message">{errors.fromAmount}</div>
          )}
        </div>

        <div className="swap-button-container">
          <button
            type="button"
            className="swap-tokens-button"
            onClick={handleSwapTokens}
            disabled={submitting}
            aria-label="Swap tokens"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="swap-section">
          <label className="swap-label">Amount to receive</label>
          <div className="input-group">
            <div className="token-selector-container">
              <button
                type="button"
                className="token-select-button"
                onClick={() => {
                  setShowToDropdown(!showToDropdown);
                  setShowFromDropdown(false);
                }}
              >
                <img
                  src={getTokenIcon(toToken)}
                  alt={toToken}
                  className="token-icon"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <span>{toToken}</span>
                <svg
                  className="dropdown-arrow"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2 4L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <TokenSelector
                value={toToken}
                onChange={setToToken}
                onClose={() => setShowToDropdown(false)}
                isOpen={showToDropdown}
              />
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                className="amount-input"
                value={toAmount}
                readOnly
                placeholder="0.0"
              />
              {prices[toToken] && toAmount ? (
                <span className="usd-value">
                  ≈ $
                  {(() => {
                    const usdValue =
                      parseFloat(toAmount) * parseFloat(prices[toToken]);
                    // If value is very small (< 0.01), show more decimal places
                    if (usdValue > 0 && usdValue < 0.01) {
                      return usdValue.toFixed(6);
                    }
                    return usdValue.toFixed(2);
                  })()}{" "}
                  USD
                </span>
              ) : toToken && toAmount ? (
                <span className="usd-value" style={{ color: "#ef4444" }}>
                  Price not available for {toToken}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className={`submit-button ${submitting ? "submitting" : ""}`}
          disabled={
            submitting ||
            !fromAmount ||
            !!errors.fromAmount ||
            fromToken === toToken
          }
        >
          {submitting ? (
            <>
              <div className="button-spinner"></div>
              <span>Processing...</span>
            </>
          ) : (
            "CONFIRM SWAP"
          )}
        </button>
      </form>
    </div>
  );
}

export default SwapForm;
