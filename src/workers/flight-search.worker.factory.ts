import * as Comlink from 'comlink'

function createFlightSearchWorker() {
  const worker = new Worker(new URL('./flight-search.worker.ts', import.meta.url))
  return Comlink.wrap<import('./flight-search.worker').FlightSearchWorker>(worker)
}

let flightSearchWorker: ReturnType<typeof createFlightSearchWorker> | undefined

export function getFlightSearchWorker() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!flightSearchWorker) {
    flightSearchWorker = createFlightSearchWorker()
  }

  return flightSearchWorker
} 