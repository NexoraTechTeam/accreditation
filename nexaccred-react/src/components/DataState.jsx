import React from 'react';

/**
 * The one place that decides what a loading state, an empty state, and each
 * class of API error look like. Every screen backed by useFetch renders
 * through this instead of improvising its own "Loading..." text — keeps the
 * error vocabulary (403 vs 401 vs 503 vs generic) consistent app-wide.
 */
export function DataState({ loading, error, children, loadingLabel = 'Loading…' }) {
  if (loading) {
    return <div className="py-16 text-center text-sm text-ink-faint">{loadingLabel}</div>;
  }

  if (error) {
    if (error.status === 403) {
      return (
        <div className="rounded-xl border border-status-orangeBg bg-status-orangeBg/40 p-6 text-center">
          <p className="text-sm font-semibold text-status-orange">You don't have permission to view this</p>
          <p className="mt-1 text-xs text-ink-muted">{error.body?.message || error.message}</p>
        </div>
      );
    }
    if (error.status === 503) {
      return (
        <div className="rounded-xl border border-status-yellowBg bg-status-yellowBg/40 p-6 text-center">
          <p className="text-sm font-semibold text-status-yellow">
            {error.body?.system ? `${error.body.system} is unavailable` : 'Data unavailable'}
          </p>
          <p className="mt-1 text-xs text-ink-muted">{error.body?.message || error.message}</p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-status-redBg bg-status-redBg/40 p-6 text-center">
        <p className="text-sm font-semibold text-status-red">Something went wrong</p>
        <p className="mt-1 text-xs text-ink-muted">{error.body?.message || error.message}</p>
      </div>
    );
  }

  return children;
}
