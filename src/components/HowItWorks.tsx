export function HowItWorks() {
  const steps = [
    { title: "Find a Plug", desc: "Browse verified electricians and plumbers near you." },
    { title: "Book & Pay", desc: "Agree on terms and pay via our secure escrow system." },
    { title: "Job Done", desc: "Release funds once you're satisfied with the work." }
  ]

  return (
    <section id="how-it-works" className="bg-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl text-midnight text-center mb-12">How it works for you</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="text-center group">
              <div className="w-12 h-12 bg-bone rounded-full flex items-center justify-center text-midnight font-display font-bold text-xl mb-4 mx-auto group-hover:bg-gold transition-colors">
                {i + 1}
              </div>
              <h3 className="text-xl text-midnight mb-2">{step.title}</h3>
              <p className="text-slate">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
