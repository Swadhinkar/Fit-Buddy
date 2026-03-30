import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 pb-16 px-4 md:px-10 overflow-hidden bg-[rgb(var(--body-color))]">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          style={{ y: y1 }}
          className="absolute -top-[5%] -left-[10%] w-[70%] h-[50%] bg-[rgb(var(--primary)/0.15)] blur-[100px] rounded-full" 
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-[10%] -right-[5%] w-[60%] h-[50%] bg-[rgb(var(--secondary)/0.1)] blur-[100px] rounded-full" 
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        {/* Changed to grid-cols-1 for mobile, lg:grid-cols-2 for desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          
          {/* TEXT CONTENT */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-bold text-[10px] md:text-xs tracking-widest mb-6 border border-[rgb(var(--primary)/0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--primary))] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[rgb(var(--primary))]"></span>
                </span>
                LIVE: AI COACHING 3.0
              </span>
              
              <h1 className="text-4xl md:text-6xl lg:text-8xl text-[rgb(var(--text-primary))] font-black tracking-tighter leading-tight mb-6">
                Empowering <br className="hidden md:block" />
                Your Fitness <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--primary))] via-[rgb(var(--secondary))] to-[rgb(var(--accent))]">
                  Evolution
                </span>
              </h1>

              <p className="max-w-xl mx-auto lg:mx-0 text-base md:text-lg text-[rgb(var(--text-muted))] mb-8">
                FitBuddy transforms your smartphone into a professional-grade fitness lab. 
                Track, analyze, and evolve with AI insights.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="px-8 py-4 bg-[rgb(var(--primary))] text-white font-black rounded-2xl shadow-xl hover:bg-[rgb(var(--primary-hover))] transition-all active:scale-95">
                  Get Started
                </button>
                <button className="px-8 py-4 bg-transparent text-[rgb(var(--text-primary))] font-bold rounded-2xl border border-[rgb(var(--card-depth-2))] hover:bg-[rgb(var(--card-depth-1))] transition-all">
                  View Features
                </button>
              </div>
            </motion.div>
          </div>

          {/* VISUAL ASSET (Now visible on all screens) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative order-1 lg:order-2 w-full max-w-[320px] md:max-w-[450px] mx-auto lg:max-w-none"
          >
            {/* Main Visual Container */}
            <div className="relative z-20 bg-[rgb(var(--card-depth-0))] border border-[rgb(var(--card-depth-1))] rounded-[2.5rem] md:rounded-[3.5rem] p-3 shadow-2xl backdrop-blur-xl">
              <img 
                src="/Hero_bg_version_2.0.jpg" 
                alt="Fitness App" 
                className="rounded-[2rem] md:rounded-[3rem] w-full aspect-square object-cover"
              />
              
              {/* Floating Mini-Card 1: Heart Rate (Scaled for mobile) */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 md:-right-8 top-10 bg-[rgb(var(--card-depth-0))] p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl border border-[rgb(var(--card-depth-1))] flex items-center gap-3"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-sm">❤️</div>
                <div className="hidden xs:block">
                  <p className="text-[8px] md:text-[10px] text-[rgb(var(--text-muted))] font-bold uppercase tracking-tighter">Heart Rate</p>
                  <p className="font-black text-[rgb(var(--text-primary))] text-xs md:text-base">128 BPM</p>
                </div>
              </motion.div>

              {/* Floating Mini-Card 2: Stats (Scaled for mobile) */}
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -left-4 md:-left-12 bottom-12 md:bottom-20 bg-[rgb(var(--primary))] p-3 md:p-5 rounded-2xl md:rounded-3xl shadow-2xl text-white"
              >
                <p className="text-[10px] md:text-xs opacity-80 mb-1">Progress</p>
                <p className="text-xl md:text-2xl font-black user-select-none pointer-events-none">84%</p>
              </motion.div>
            </div>

            {/* Background Decorative Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border border-[rgb(var(--text-primary)/0.05)] rounded-full pointer-events-none" />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;