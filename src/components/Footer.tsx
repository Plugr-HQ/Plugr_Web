import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone } from 'lucide-react'
import SocialIcons from '@/src/components/SocialIcons'



function Footer() {
  return (
    <footer className="bg-[#0A1529] text-white py-16 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-4 gap-12">
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <Image src="/logo_light.svg" alt="Plugr Logo" width={124} height={48} />
          </Link>
          <p className="text-gray-400 font-medium max-w-sm mb-8">
            Pledging allegiance to your success. The trusted network for verified artisans in Lagos.
          </p>
          <div className="flex flex-row gap-4 items-center transition-colors cursor-pointer">
            <Mail className="w-5 h-5 text-[#DBA134]" />
            <a href="mailto:[EMAIL_ADDRESS]">hello@getplugr.com</a>
          </div> <br />
          <div className="flex flex-row gap-4 items-center transition-colors cursor-pointer">
            <Phone className="w-5 h-5 text-[#DBA134]" /> <a href="tel:+2348180147857">+2348180147857</a>
          </div>
          <SocialIcons />
        </div>


        <section className="flex flex-row gap-14">
          <div>
            <h5 className="uppercase text-xs tracking-widest text-[white] mb-6 font-bold">Quick Links</h5>
            <ul className="space-y-4 font-medium text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
              <li><Link href="/find" className="hover:text-white transition-colors">Find a Plug</Link></li>
              <li><Link href="/become-a-plug" className="hover:text-white transition-colors">Become a Plug</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="uppercase text-xs tracking-widest text-[white] mb-6 font-bold">Legal</h5>
            <ul className="space-y-4 font-medium text-gray-400">
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Dispute Policy</Link></li>
            </ul>
          </div>
        </section>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
        <span>&copy; 2026 ALHAZEN. All rights reserved.</span>
      </div>
    </footer>
  )
}

export default Footer;
