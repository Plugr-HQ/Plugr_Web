'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/src/components/Navbar'
import Footer from '@/src/components/Footer'
import { PlugCard, Plug } from '@/src/components/PlugCard'
import { Search, Filter, MapPin, ChevronDown } from 'lucide-react'

export default function FindPlugPage() {
  // Mock data for initial plugs
  const initialPlugs: Plug[] = [
    { id: '1', name: "Suleiman Yusuf", trade: "Electrician", rating: 4.8, reviewCount: 28, status: "Busy", badge: "Verified" },
    { id: '2', name: "John Okoro", trade: "Plumber", rating: 4.9, reviewCount: 45, status: "Available", badge: "Pro" },
    { id: '3', name: "Tunde Williams", trade: "Electrician", rating: 4.7, reviewCount: 19, status: "Busy", badge: "Verified" },
    { id: '4', name: "Blessing Adebayo", trade: "Plumber", rating: 4.6, reviewCount: 12, status: "Available", badge: "Basic" },
    { id: '5', name: "David Nwosu", trade: "Electrician", rating: 4.9, reviewCount: 32, status: "Available", badge: "Pro" },
    { id: '6', name: "Emeka Obi", trade: "Plumber", rating: 4.5, reviewCount: 7, status: "Busy", badge: "Verified" },
  ]

  // States for interactive filtering
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)

  // States for API-fetched categories
  const [apiCategories, setApiCategories] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false)

  const fixedCategories = ["All", "Electrician", "Plumber"]

  // Fetch extra categories from API
  useEffect(() => {
    async function fetchCategories() {
      setIsLoadingCategories(true)
      try {
        // --- LEAVE API SPACE BLANK FOR NOW ---
        // const res = await fetch('YOUR_API_ENDPOINT_HERE')
        // const data = await res.json()
        // setApiCategories(data) 

        // Simulating an empty or incoming API payload for now
        setApiCategories(["Carpenter", "Mechanic", "Painter"])
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Combined search and category filter logic
  const filteredPlugs = initialPlugs.filter((plug) => {
    const matchesCategory = selectedCategory === "All" || plug.trade.toLowerCase() === selectedCategory.toLowerCase()
    const matchesSearch = plug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plug.trade.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  return (
    <main className="flex flex-col min-h-screen bg-bone">
      <Navbar />
      {/* Main Heading with split color accents */}
      <h1 className="text-3xl p-6 font-display font-black max-w-md mt-20">
        Find a <span className="text-midnight">verified</span>{' '}
        <span className="text-gold">Verified Plug.</span>
      </h1>

      {/* Subtitle Paragraph */}
      <p className="px-6 py-1 text-slate text-base md:text-lg font-normal leading-relaxed max-w-sm">
        Plugr doesn't promise you jobs. It gives you the edge to earn them.
      </p>

      <div className="relative bg-white rounded-lg px-4 my-6 py-2.5 w-[85%] max-w-7xl flex items-center gap-2 mx-auto text-[14px]">
        <Search className="text-slate w-4 h-4" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or trade..."
          className="w-full bg-white rounded-lg text-midnight font-sans placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      {/* Filters & Content */}
      <div className="max-w-7xl mx-auto w-full px-6">

        {/* Category Chips & Dropdown Wrapper */}
        <div className="relative flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar">
          {fixedCategories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1 rounded-pill font-medium text-[12px] transition-colors whitespace-nowrap ${selectedCategory === cat
                ? "bg-gold text-midnight"
                : "bg-white text-slate border border-slate/10 hover:border-gold/50"
                }`}
            >
              {/* Pluralize UI text nicely if needed, keeping matching logic exact */}
              {cat === "Electrician" ? "Electricians" : cat === "Plumber" ? "Plumbers" : cat}
            </button>
          ))}

          {/* More Filters Toggle */}
          <div className="ml-auto relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-1 text-slate hover:text-midnight bg-white px-4 py-2 rounded-pill border transition-all ${isDropdownOpen ? "border-gold text-midnight" : "border-slate/10"
                }`}
            >
              <Filter className="w-3 h-3" />
              <ChevronDown className={`w-3 h-3   transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* API Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate/10 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-1 text-xs font-semibold text-slate/60 uppercase tracking-wider">
                  Extended Categories
                </div>
                {isLoadingCategories ? (
                  <div className="px-4 py-2 text-sm text-slate">Loading tags...</div>
                ) : (
                  apiCategories.map((apiCat, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCategory(apiCat)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-bone ${selectedCategory === apiCat ? "text-gold font-bold bg-bone" : "text-midnight"
                        }`}
                    >
                      {apiCat}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {filteredPlugs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 justify-items-center">
            {filteredPlugs.map((plug) => (
              <PlugCard key={plug.id} plug={plug} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate/20">
            <p className="text-slate font-medium">No plugs found matching your selection.</p>
            <button
              onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
              className="text-gold font-bold mt-2 hover:underline text-sm"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Dynamic Pagination Info */}
        <div className="py-8 text-center">
          <p className="text-slate text-sm mb-4">Showing {filteredPlugs.length} Plugs in your area</p>
          {filteredPlugs.length > 0 && (
            <button className="text-gold font-bold hover:underline">Load more</button>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}