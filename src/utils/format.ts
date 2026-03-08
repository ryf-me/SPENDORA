export function formatCurrency(amount: number, currency: string) {
    if (currency === "LKR") {
        return `Rs. ${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    try {
        return amount.toLocaleString(undefined, {
            style: "currency",
            currency: currency,
        });
    } catch (e) {
        // Fallback if currency code is invalid or not supported
        return `${currency} ${amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }
}
