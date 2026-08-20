export function ApiErrorState() {
  return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6"><h2 className="font-semibold text-rose-900">We couldn’t load your financial data</h2><p className="mt-2 text-sm leading-6 text-rose-700">The SpendLens API is unavailable or returned an invalid response. Check the API configuration and try again.</p></div>;
}
