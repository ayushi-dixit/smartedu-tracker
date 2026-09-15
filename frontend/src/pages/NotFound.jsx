import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <p className="font-display text-3xl font-semibold text-ink-900">Page not found</p>
      <p className="text-sm text-ink-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-2">Go home</Link>
    </div>
  );
}
