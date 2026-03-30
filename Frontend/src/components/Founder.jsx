import React from 'react'

const Founder = () => {
    return (
        <section className="py-32 px-6">
            <div className="max-w-5xl mx-auto rounded-[4rem] bg-[rgb(var(--card-depth-0))] border border-[rgb(var(--card-depth-1))] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-2xl">
                <div className="w-64 h-64 rounded-[3rem] bg-gradient-to-tr from-[rgb(var(--primary))] to-[rgb(var(--accent))] flex-shrink-0 flex items-center justify-center text-7xl shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
                    <img src="https://res.cloudinary.com/dyliap6u9/image/upload/v1773469162/66d45dc7-6491-4e05-9fd9-b6e4c286fd1a_tdovri.jpg" alt="Founder" className="w-full h-full object-cover rounded-[3rem]" onContextMenu={(e) => e.preventDefault()} />
                </div>
                <div>
                    <span className="text-[rgb(var(--primary))] font-black tracking-widest text-xs uppercase mb-3 block">The Creator</span>
                    <h2 className="text-4xl font-bold mb-6">Behind the Code & Kettlebells</h2>
                    <p className="text-[rgb(var(--text-muted))] text-xl leading-relaxed italic mb-8">
                        "FitBuddy started as a personal project to solve my own consistency issues. Today, it’s a platform built for every student,
                        professional, and dreamer who wants to master their health through logic and discipline."
                    </p>
                    <p className="font-black text-2xl tracking-tight">Swadhin Kumar Kar</p>
                    <p className="text-[rgb(var(--text-muted))] font-medium">Lead Developer & Fitness Enthusiast</p>
                </div>
            </div>
        </section>
    )
}

export default Founder
