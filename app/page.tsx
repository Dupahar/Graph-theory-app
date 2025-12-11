import Link from 'next/link';
import { ArrowRight, Network, Calendar } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-12">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Graph Theory Explorer
        </h1>
      </div>

      <div className="grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-2 lg:text-left gap-8">
        <Link
          href="/minor"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`mb-3 text-2xl font-semibold flex items-center gap-2`}>
            <Network className="w-6 h-6 text-blue-400" />
            Minor Project
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Detect Euler and Hamiltonian Paths in Networks. Analyze vertex degrees and visualize algorithms.
          </p>
        </Link>

        <Link
          href="/major"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className={`mb-3 text-2xl font-semibold flex items-center gap-2`}>
            <Calendar className="w-6 h-6 text-green-400" />
            Major Project
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              <ArrowRight className="w-4 h-4 ml-1" />
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Graph Coloring and Timetable Scheduling. Automated system for scheduling university classes.
          </p>
        </Link>
      </div>
    </main>
  );
}
