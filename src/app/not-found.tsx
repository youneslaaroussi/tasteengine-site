import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found | TasteEngine',
  description: 'The page you are looking for could not be found.',
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          404
        </h1>
        <h2 className="mt-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
          Page Not Found
        </h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          The page you are looking for could not be found.
        </p>
        <div className="mt-8">
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  )
}