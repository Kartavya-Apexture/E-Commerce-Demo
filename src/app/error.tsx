"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container section empty">
      <h1>A little pause.</h1>
      <p>
        We couldn’t load this page. Your bag is still saved in your browser.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
