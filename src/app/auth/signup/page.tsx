import Link from 'next/link'
import Image from 'next/image'

export default function SignupPage() {
  return (
    <main className="flex flex-col min-h-screen bg-midnight text-white px-6 py-12">
      <div className="grow flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-2 mb-8">
          <Image src="/logo.svg" alt="Plugr Logo" width={48} height={48} className="brightness-0 invert" />
          <span className="text-4xl font-black tracking-tighter">plugr</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display mb-4 leading-tight">
          Join the artisan network built on <span className="text-gold">trust</span>.
        </h1>
        <p className="text-steel-blue text-lg mb-12 max-w-sm">
          Select how you want to use Plugr to get started.
        </p>

        <div className="w-full max-w-sm space-y-4">
          <Link href="/auth/signup/phone?role=client" className="block">
            <div className="bg-white group hover:bg-gold transition-colors p-6 rounded-card border border-white/10 text-left cursor-pointer">
              <h3 className="text-midnight font-bold text-xl mb-1 group-hover:text-midnight transition-colors">I need a Plug</h3>
              <p className="text-slate group-hover:text-midnight/70 transition-colors text-sm">Hire verified electricians and plumbers for your home or office.</p>
            </div>
          </Link>

          <Link href="/auth/signup/phone?role=plug" className="block">
            <div className="bg-deep-blue group hover:bg-gold transition-colors p-6 rounded-card border border-white/10 text-left cursor-pointer">
              <h3 className="text-white font-bold text-xl mb-1 group-hover:text-midnight transition-colors">I am a Plug</h3>
              <p className="text-steel-blue group-hover:text-midnight/70 transition-colors text-sm">Build your verified identity and earn consistent work in Ikeja.</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-steel-blue">
        Already have an account? <Link href="/auth/login" className="text-gold font-bold">Log in</Link>
      </div>
    </main>
  )
}
