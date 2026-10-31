import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, HelpCircle } from 'lucide-react';

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'How does Meet & Greet parking work at the airport?',
      a: 'With Meet & Greet parking, you drive directly to the designated approved operator collection bays at the terminal departures forecourt or Short Stay car park. A professional, insured chauffeur meets you, logs vehicle mileage, and photographs car condition. They drive your vehicle to our secure off-site compound yard. When your return flight lands, your car is brought back to the terminal arrivals forecourt ready for your drive home.'
    },
    {
      q: 'What is the difference between Meet & Greet and Park & Ride?',
      a: 'Park & Ride requires driving directly to our secure compound yard located 5 to 10 minutes from the airport perimeter, where you park and board a complimentary airport shuttle bus to the terminal. Meet & Greet allows you to drive straight to the airport terminal without needing to board any shuttle bus.'
    },
    {
      q: 'Where are our compound yards located?',
      a: 'Our secure storage yards are situated within high-security perimeter zones adjacent to major UK airports: Bath Road & Colnbrook By-Pass (Heathrow), Charlwood Road & Lowfield Heath (Gatwick), Ringway Road & Styal Road (Manchester), Takeley (Stansted), President Way (Luton), and Coventry Road (Birmingham). All yards feature 24/7 CCTV, barrier entry, and Park Mark® safer parking accreditation.'
    },
    {
      q: 'Are airport terminal entry and exit fees included in the price?',
      a: 'Yes. All our published Meet & Greet quotes include the mandatory airport terminal forecourt drop-off and collection charges so you experience zero surprise fees on the day of travel.'
    },
    {
      q: 'Can I cancel or amend my booking?',
      a: 'Yes! All flexible bookings can be amended or cancelled free of charge up to 24 hours prior to your scheduled arrival time.'
    },
    {
      q: 'How do I use my promo code (e.g. apd10 or WLCME)?',
      a: 'Our search engine automatically applies the 10% promotional code "apd10" to your quote. You can also enter partner codes in the promo code field to receive instant discounts of 10% to 15% off standard gate rates.'
    }
  ];

  return (
    <section className="py-12 bg-white border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#061F75] text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions? We Have Answers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#061F75]">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Everything you need to know about our UK airport compound yards, valet procedures, and safety guarantees.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/60"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-[#061F75] transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#C8102E] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
