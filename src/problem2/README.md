# Problem 2: Fancy Form - Solution

## Approach

I built a currency swap form using React and Vite. The form allows users to swap between different tokens with real-time exchange rate calculation.

## Implementation Details

### Setup

I used Vite as the build tool because it was mentioned as a bonus requirement. React was chosen for managing component state and handling user interactions. All styling is done with vanilla CSS.

### Token Price Data

The form fetches token prices from the provided API endpoint when the component first loads. The API returns data in array format, which is converted to an object for easier access. The prices are stored in React state so they can be used for calculations. If the API call fails, an error message is shown to the user.

The API returns an array of objects with format: `[{currency: 'ETH', price: 1645.93, date: '...'}, ...]`. This is converted to a price map object for efficient lookups.

Here is the code for fetching prices:

```javascript
const fetchPrices = async () => {
  try {
    const response = await fetch(PRICES_API);
    const data = await response.json();

    // Handle both array and object formats
    let priceMap = {};

    if (Array.isArray(data)) {
      // Convert array to object: {ETH: 1645.93, SWTH: 0.001, ...}
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
      priceMap = data;
    }

    setPrices(priceMap);
  } catch (error) {
    console.error("Error fetching prices:", error);
    setErrors({
      general: "Failed to load token prices. Please refresh the page.",
    });
  } finally {
    setLoading(false);
  }
};
```

This function is called in a useEffect hook when the component mounts.

### Exchange Rate Calculation

The exchange rate is calculated based on USD value to ensure accuracy. When swapping tokens, the USD value remains constant, which is the correct approach for currency conversion.

When the user enters an amount to send, the form automatically calculates how much they will receive. This calculation happens whenever the amount changes or when the user selects different tokens. The calculation uses a useEffect hook that watches for changes to the amount and token selections.

The correct formula is:

1. Calculate USD value of the amount to send: `fromAmount × fromTokenPrice`
2. Divide by the price of the token to receive: `USD_value / toTokenPrice`

This ensures the USD value remains the same before and after the swap.

Here is the useEffect that handles the calculation:

```javascript
useEffect(() => {
  if (fromAmount && prices[fromToken] && prices[toToken]) {
    // Calculate USD value first
    const usdValue = parseFloat(fromAmount) * parseFloat(prices[fromToken]);
    // Then calculate how much of toToken we can get with that USD value
    const calculated = (usdValue / parseFloat(prices[toToken])).toFixed(6);
    setToAmount(calculated);
  } else if (!fromAmount) {
    setToAmount("");
  }
}, [fromAmount, fromToken, toToken, prices]);
```

This runs whenever any of the dependencies change, recalculating the receive amount automatically.

### Token Selection

I implemented dropdown menus for selecting tokens. Each dropdown shows a list of available tokens with their icons. The icons are loaded from the Switcheo token-icons repository. Only tokens that have price data available are shown in the dropdowns.

The dropdowns can be opened by clicking on the token selector button. When a token is selected, the dropdown closes and the selected token is updated. If an icon fails to load, it is hidden gracefully without breaking the UI.

The token icon URL is constructed like this:

```javascript
const getTokenIcon = (token) => {
  return `${TOKEN_ICON_BASE}/${token}.svg`;
};
```

And the icon has an error handler to hide it if it fails to load:

```javascript
<img
  src={getTokenIcon(token)}
  alt={token}
  className="token-icon"
  onError={(e) => {
    e.target.style.display = "none";
  }}
/>
```

### Input Validation

I added several validation checks to ensure the form works correctly:

First, the amount field must not be empty. If it is empty and the user tries to submit, an error message appears.

Second, the amount must be a valid positive number. The input only accepts numbers and decimal points. If the user tries to enter invalid characters, they are prevented from doing so.

Third, there is a maximum limit of 1,000,000 to prevent unreasonably large amounts.

Fourth, the form checks that both selected tokens have price data available. If a token does not have a price, it cannot be used for swapping.

Fifth, the form prevents users from trying to swap a token with itself. If both tokens are the same, the submit button is disabled and an error message can be shown.

All validation errors are displayed directly below the relevant input field so users know what needs to be fixed.

The validation function looks like this:

```javascript
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
```

For the input handler, I use a regex to only allow numbers and decimal points:

```javascript
const handleFromAmountChange = (e) => {
  const value = e.target.value;
  if (value === "" || /^\d*\.?\d*$/.test(value)) {
    setFromAmount(value);
    const error = validateInput(value);
    setErrors((prev) => ({ ...prev, fromAmount: error }));
  }
};
```

### User Experience Features

I added a loading spinner that appears while the token prices are being fetched from the API. This gives users feedback that something is happening.

When the user submits the form, there is a simulated delay of 2 seconds to mimic a backend API call. During this time, the submit button shows a loading spinner and is disabled to prevent multiple submissions.

The submit handler includes all validation checks and the simulated delay:

```javascript
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
```

I added a swap button between the two input sections that allows users to quickly swap the from and to tokens. This is a common feature in currency exchange interfaces.

The swap function exchanges the tokens and swaps the amounts to maintain the USD value. The old toAmount becomes the new fromAmount, and the new toAmount is automatically recalculated:

```javascript
const handleSwapTokens = () => {
  // Swap tokens
  const tempToken = fromToken;
  setFromToken(toToken);
  setToToken(tempToken);

  // Swap amounts to maintain USD value
  // The old toAmount becomes the new fromAmount
  setFromAmount(toAmount);
  // toAmount will be recalculated automatically by useEffect
  setErrors({});
};
```

The form also displays the USD equivalent value for both the amount being sent and the amount being received. For very small values (less than $0.01), it displays 6 decimal places instead of 2 to show accurate values. This helps users understand the value of their transaction.

All interactive elements have hover states and visual feedback. The form is responsive and works well on both desktop and mobile devices.

### Component Structure

The main component is SwapForm. It manages all the state including token prices, selected tokens, input amounts, error messages, and loading states.

There is a TokenSelector sub-component that renders the dropdown menu for token selection. This component receives props for the current selection, a callback to change the selection, and whether the dropdown should be open.

The form is divided into two main sections: one for the amount to send and one for the amount to receive. The send amount is an editable input field, while the receive amount is calculated automatically and displayed as a read-only field.

### Error Handling

I implemented error handling for several scenarios. If the API call to fetch prices fails, a general error message is shown. If a token icon fails to load, it is hidden without breaking the layout. If validation fails, specific error messages are shown for each field.

The form also checks if selected tokens have price data available. If a token doesn't have a price, an error message is shown immediately when the token is selected, not just on submit. This provides better user experience.

All errors are cleared when the user fixes the issue or when a successful submission occurs.

### Styling

The form uses a card-based layout with a white background on a gradient purple background. All inputs and buttons have rounded corners and smooth transitions. The design is clean and modern with good spacing and typography.

The form is fully responsive. On smaller screens, the padding and font sizes adjust to ensure everything remains readable and usable.

## Running the Solution

To run the project, first install the dependencies with npm install. Then start the development server with npm run dev. The form will open in your browser at localhost:3000.

To build for production, run npm run build. This creates an optimized build in the dist folder.
