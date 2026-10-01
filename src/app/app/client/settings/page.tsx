import { Navbar } from '@/src/components/Navbar'
import { MobileNav } from '@/src/components/MobileNav'
import { User, Bell, Shield, LogOut, ChevronRight, CreditCard } from 'lucide-react'

export default function ClientSettingsPage() {
  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Personal Information", desc: "Update your name and number" },
        { icon: CreditCard, label: "Payment Methods", desc: "Cards and bank details" }
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", desc: "WhatsApp and in-app alerts" },
        { icon: Shield, label: "Privacy & Security", desc: "Managed your data and login" }
      ]
    }
  ]

  return (
    <main className="flex flex-col min-h-screen bg-bone pb-24">
      <Navbar />

      <div className="px-6 py-8 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-display text-pitch-black mb-8">Settings</h1>

        <div className="space-y-8">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-xs font-bold text-slate uppercase tracking-widest mb-4">{section.title}</h2>
              <div className="bg-white rounded-card shadow-sm border border-bone overflow-hidden">
                {section.items.map((item, i) => (
                  <button 
                    key={i} 
                    className="w-full flex items-center justify-between p-4 hover:bg-bone/20 transition-colors border-b border-bone last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-bone rounded-full flex items-center justify-center text-pitch-black">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-sm text-pitch-black">{item.label}</h4>
                        <p className="text-[10px] text-slate">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button className="w-full bg-white text-red-500 font-bold py-4 rounded-card border border-bone flex items-center justify-center gap-2 hover:bg-red-50 transition-colors mt-8">
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>

      <MobileNav role="client" />
    </main>
  )
}
