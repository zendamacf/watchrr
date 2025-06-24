'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8 dark:bg-gray-800">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <AlertCircleIcon className="mx-auto h-12 w-auto text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Oops! Something went wrong.
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Error: {error.message}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Digest: {error.digest}</p>
        </div>
        <div className="space-y-2">
          <Button className="w-full" variant="outline" onClick={() => reset()}>
            Try again
          </Button>
          <Link
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            href="/"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

function AlertCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
