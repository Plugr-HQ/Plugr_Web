import { Button } from './Button'

export function Hero() {
  return (
    <section className="bg-midnight px-4 pt-12 pb-20 text-center">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-display text-white leading-tight mb-6">
          Pledging allegiance to your <span className="text-gold">success</span>.
        </h1>
        <p className="text-steel-blue text-lg mb-10 max-w-2xl mx-auto">
          Find Nigeria's first verified skills identity platform for artisans. Connecting trusted electricians and plumbers in Ikeja with the edge to earn.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <Button href="/find" fullWidth className="md:w-auto">Find a Plug</Button>
          <Button variant="outline" href="/become-a-plug" fullWidth className="md:w-auto">Become a Plug</Button>
        </div>
      </div>
    </section>
  )
}
