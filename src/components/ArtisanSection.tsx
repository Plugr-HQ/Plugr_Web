import { Button } from './Button'

export function ArtisanSection() {
  return (
    <section className="bg-midnight py-20 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-display text-white mb-6">
          Are you a skilled electrician or plumber in Ikeja?
        </h2>
        <p className="text-steel-blue text-lg mb-10 max-w-2xl mx-auto">
          Build your verified professional identity. Plugr doesn't promise you jobs. It gives you the edge to earn them.
        </p>
        <Button href="/become-a-plug" className="md:w-64">Become a Plug</Button>
      </div>
    </section>
  )
}
