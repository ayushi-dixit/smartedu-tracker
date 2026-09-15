export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-md border border-risk-high/30 bg-risk-highBg px-4 py-3 text-sm text-risk-high">
      {message}
    </div>
  );
}
