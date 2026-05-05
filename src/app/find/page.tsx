import Link from 'next/link'
import { Navbar } from '@/src/components/Navbar'
import { Footer } from '@/src/components/Footer'
import { PlugCard, Plug } from '@/src/components/PlugCard'
import { Search, Filter, MapPin } from 'lucide-react'

export default function FindPlugPage() {
  const plugs: (Plug & { id: string })[] = [
    { id: '1', name: "Suleiman Yusuf", trade: "Electrician", rating: 4.8, status: "Verified", badge: "Verified" },
    { id: '2', name: "John Okoro", trade: "Plumber", rating: 4.9, status: "Available", badge: "Pro" },
    { id: '3', name: "Tunde Williams", trade: "Electrician", rating: 4.7, status: "Busy", badge: "Verified" },
    { id: '4', name: "Blessing Adebayo", trade: "Plumber", rating: 4.6, status: "Verified", badge: "Basic" },
    { id: '5', name: "David Nwosu", trade: "Electrician", rating: 4.9, status: "Available", badge: "Pro" },
    { id: '6', name: "Emeka Obi", trade: "Plumber", rating: 4.5, status: "Busy", badge: "Verified" },
  ]

  const categories = ["All", "Electricians", "Plumbers"]

  return (
    <main className="flex flex-col min-h-screen bg-bone">
      <Navbar />
      
      {/* Search & Header */}
      <div className="bg-midnight pt-8 pb-12 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-display text-white mb-6">Find a verified Plug in Ikeja</h1>
          
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search for an electrician or plumber..." 
                className="w-full bg-white rounded-pill py-3 pl-12 pr-4 text-midnight font-sans placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <button className="flex items-center justify-center gap-2 bg-deep-blue text-white rounded-pill px-6 py-3 border border-white/10 hover:bg-white/10 transition-colors">
              <MapPin className="w-5 h-5 text-gold" />
              <span>Ikeja, Lagos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="max-w-7xl mx-auto w-full px-4 py-8">
        {/* Category Chips */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat, i) => (
            <button 
              key={i} 
              className={`px-6 py-2 rounded-pill font-medium text-sm transition-colors whitespace-nowrap ${
                cat === "All" ? "bg-gold text-midnight" : "bg-white text-slate border border-slate/10 hover:border-gold/50"
              }`}
            >
              {cat}
            </button>
          ))}
          <button className="ml-auto flex items-center gap-2 text-slate hover:text-midnight">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">More filters</span>
          </button>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {plugs.map((plug) => (
            <Link key={plug.id} href={`/p/${plug.id}`}>
              <PlugCard plug={plug} />
            </Link>
          ))}
        </div>

        {/* Empty State / Pagination Simulation */}
        <div className="mt-12 text-center">
          <p className="text-slate text-sm mb-4">Showing {plugs.length} Plugs in your area</p>
          <button className="text-gold font-bold hover:underline">Load more</button>
        </div>
      </div>

      <Footer />
    </main>
  )
}
