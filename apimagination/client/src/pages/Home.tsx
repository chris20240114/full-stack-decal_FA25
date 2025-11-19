import { Link } from "react-router-dom"
export default function Home() {
  return (
    <section className="text-center space-y-6 mt-10">
      <h2 className="text-4xl font-bold text-emerald-700">Welcome to BrewScout</h2>
      <p className="text-gray-600 max-w-md mx-auto">
        Discover and save your favorite cafés around UC Berkeley.
      </p>
      <Link to="/search" className="px-5 py-3 bg-emerald-600 text-white rounded shadow hover:bg-emerald-700">
        Start Searching
      </Link>
    </section>
  )
}
