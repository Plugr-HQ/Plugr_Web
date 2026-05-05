import { Navbar } from '@/src/components/Navbar'
import { MobileNav } from '@/src/components/MobileNav'
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react'
import { cn } from '@/src/lib/utils'

export default function PlugWalletPage() {
  const transactions = [
    { type: 'credit', title: 'Job Completion: Funke A.', date: 'Oct 24, 2023', amount: '₦12,500', status: 'Locked' },
    { type: 'credit', title: 'Visit Deposit: John O.', date: 'Oct 23, 2023', amount: '₦2,500', status: 'Available' },
    { type: 'debit', title: 'Withdrawal to Bank', date: 'Oct 21, 2023', amount: '₦40,000', status: 'Success' },
  ]

  return (
    <main className="flex flex-col min-h-screen bg-bone pb-24">
      <Navbar />

      <div className="bg-midnight pt-8 pb-12 px-6 text-white text-center">
        <div className="max-w-7xl mx-auto">
          <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
             <Wallet className="w-8 h-8 text-midnight" />
          </div>
          <h1 className="text-sm font-bold text-steel-blue uppercase tracking-widest mb-1">Total Balance</h1>
          <div className="text-4xl font-display text-white mb-8">₦54,200</div>
          
          <div className="flex gap-4 max-w-sm mx-auto">
             <button className="flex-1 bg-gold text-midnight py-3 rounded-pill font-bold text-sm">Withdraw</button>
             <button className="flex-1 bg-white/10 border border-white/20 text-white py-3 rounded-pill font-bold text-sm">Bank Setup</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-8">
        <div className="bg-gold/10 border border-gold/20 rounded-card p-4 flex gap-3 mb-8">
           <Clock className="w-5 h-5 text-gold flex-shrink-0" />
           <p className="text-xs text-midnight">
              New job earnings are locked for 24 hours for safety. <span className="font-bold underline">Learn why</span>
           </p>
        </div>

        <h2 className="text-xs font-bold text-slate uppercase tracking-widest mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {transactions.map((tx, i) => (
            <div key={i} className="bg-white rounded-card p-4 flex items-center justify-between border border-bone">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  tx.type === 'credit' ? "bg-green-50 text-green-600" : "bg-slate/10 text-slate"
                )}>
                  {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-midnight">{tx.title}</h4>
                  <p className="text-[10px] text-slate">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={cn("font-bold text-sm", tx.type === 'credit' ? "text-midnight" : "text-slate")}>
                  {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                </div>
                <div className={cn(
                  "text-[10px] font-bold uppercase",
                  tx.status === 'Locked' ? "text-amber-500" : tx.status === 'Success' ? "text-blue-500" : "text-green-500"
                )}>
                  {tx.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MobileNav />
    </main>
  )
}
