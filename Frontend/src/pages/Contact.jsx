import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Globe } from 'lucide-react';
import ContactButton from '../components/ContactButton';

const Contact = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--body-color))] text-[rgb(var(--text-primary))] pt-32 pb-20 px-4 sm:px-6 overflow-hidden" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      
      {/* --- COSMIC BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[rgb(var(--primary)/0.1)] blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[rgb(var(--secondary)/0.08)] blur-[100px] rounded-full" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* HEADER SECTION */}
        <div className="mb-20 text-center lg:text-left">
          <motion.span variants={itemVariants} className="px-4 py-2 rounded-full bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-black text-xs tracking-[0.3em] border border-[rgb(var(--primary)/0.2)]">
            GET IN TOUCH
          </motion.span>
          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black tracking-tighter mt-8 leading-[0.85]">
            Let’s Build Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--primary))] via-[rgb(var(--secondary))] to-[rgb(var(--accent))]">
              Legacy Together.
            </span>
          </motion.h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-16 items-start">
          
          {/* LEFT: CONTACT INFO CARDS */}
          <div className="lg:col-span-5 space-y-6">
            {[
              { icon: <Mail />, label: "Email Us", val: "hello@fitbuddy.ai", color: "var(--primary)" },
              { icon: <Phone />, label: "Call Directly", val: "+1 (555) 000-FIT", color: "var(--secondary)" },
              { icon: <MapPin />, label: "Visit Laboratory", val: "Rourkela, Odisha, India", color: "var(--accent)" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ x: 15, transition: { duration: 0.3 } }}
                className="group p-8 rounded-[2.5rem] bg-[rgb(var(--card-depth-0))] border border-[rgb(var(--card-depth-1))] hover:border-[rgb(var(--primary)/0.5)] transition-all flex items-center gap-6 shadow-xl shadow-black/5"
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: `rgb(${item.color})` }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[rgb(var(--text-dim))]">{item.label}</p>
                  <p className="text-xl font-bold">{item.val}</p>
                </div>
              </motion.div>
            ))}

            {/* SOCIAL CONNECT */}
            <motion.div variants={itemVariants} className="pt-8 flex gap-4">
               {['Twitter', 'Instagram', 'Github', 'LinkedIn'].map((social) => (
                 <button key={social} className="px-6 py-3 rounded-xl bg-[rgb(var(--card-depth-1))] hover:bg-[rgb(var(--primary))] hover:text-white transition-all font-bold text-xs uppercase tracking-tighter">
                   {social}
                 </button>
               ))}
            </motion.div>
          </div>

          {/* RIGHT: INTERACTIVE GLASS FORM */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-7 bg-[rgb(var(--card-depth-0))] border border-[rgb(var(--card-depth-1))] rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[rgb(var(--primary)/0.05)] rounded-bl-full pointer-events-none" />
            
            <form className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-[rgb(var(--text-dim))] ml-2">Full Name</label>
                  <input type="text" placeholder="Swadhin Kumar Kar" className="w-full bg-[rgb(var(--card-depth-1))] border-none rounded-2xl p-5 focus:ring-2 focus:ring-[rgb(var(--primary))] transition-all outline-none text-[rgb(var(--text-primary))]" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-[rgb(var(--text-dim))] ml-2">Email Address</label>
                  <input type="email" placeholder="swadhinkumarkar@fitbuddy.ai" className="w-full bg-[rgb(var(--card-depth-1))] border-none rounded-2xl p-5 focus:ring-2 focus:ring-[rgb(var(--primary))] transition-all outline-none text-[rgb(var(--text-primary))]" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-[rgb(var(--text-dim))] ml-2">Your Vision / Message</label>
                <textarea rows="5" placeholder="Tell us about your fitness goals..." className="w-full bg-[rgb(var(--card-depth-1))] border-none rounded-[2rem] p-6 focus:ring-2 focus:ring-[rgb(var(--primary))] transition-all outline-none text-[rgb(var(--text-primary))] resize-none"></textarea>
              </div>

              <ContactButton />
            </form>
          </motion.div>

        </div>
      </motion.div>

      {/* FOOTER DECORATION */}
      <div className="mt-20 border-t border-[rgb(var(--card-depth-1))] pt-10 flex justify-center opacity-30">
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
          <Globe className="w-4 h-4" /> Global Fitness Protocol v1.0
        </div>
      </div>
    </div>
  );
};

export default Contact;