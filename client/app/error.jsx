"use client";

export default function Error({ error, reset }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center text-red-500">
      <p>{error?.message || 'Something went wrong'}</p>
      <button
        onClick={() => reset()}
        className="mt-4 border border-neutral-500 px-4 py-2"
      >
        Retry
      </button>
    </div>
  );
}



