import React from "react";
import { Mail, Globe, MessageCircle, ExternalLink, Linkedin, Facebook, Phone } from "lucide-react";

export default function Contact() {
    const contactMethods = [
        {
            icon: <Mail className="w-6 h-6 text-blue-500" />,
            label: "Support Email",
            value: "insathraif004@gmail.com",
            link: "mailto:insathraif004@gmail.com",
        },
        {
            icon: <Phone className="w-6 h-6 text-green-500" />,
            label: "WhatsApp",
            value: "+94 71 074 9859",
            link: "https://wa.me/94710749859",
        },
        {
            icon: <Linkedin className="w-6 h-6 text-blue-600" />,
            label: "LinkedIn",
            value: "Insath Raif",
            link: "https://www.linkedin.com/in/insath-raif",
        },
        {
            icon: <Facebook className="w-6 h-6 text-blue-700" />,
            label: "Facebook",
            value: "Insath Raif",
            link: "https://web.facebook.com/profile.php?id=61575963225748",
        },
    ];

    return (
        <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4 mb-16">
                <h1 className="text-4xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    Get in Touch
                </h1>
                <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
                    Have questions or need support? Connect with me through any of these platforms.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contactMethods.map((method, index) => (
                    <a
                        key={index}
                        href={method.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-6 p-8 rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] hover:border-[var(--accent)] transition-all group"
                    >
                        <div className="p-4 rounded-2xl bg-[var(--bg-base)] group-hover:scale-110 transition-transform">
                            {method.icon}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs uppercase tracking-widest font-bold mb-1 opacity-50" style={{ color: "var(--text-muted)" }}>
                                {method.label}
                            </p>
                            <p className="text-lg font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                                {method.value}
                            </p>
                        </div>
                        <ExternalLink size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent)]" />
                    </a>
                ))}
            </div>

            <div className="mt-16 p-10 rounded-[3rem] text-center space-y-6 bg-[var(--bg-elevated)] border border-[var(--border)] shadow-sm">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Your Feedback Matters!</h2>
                <p style={{ color: "var(--text-secondary)" }}>
                    Help me refine Spendora. Whether it's a bug or a new idea, I'm all ears.
                </p>
                <div className="pt-2">
                    <a
                        href="/feedback"
                        className="inline-block px-10 py-4 rounded-full font-bold text-black transition-all hover:scale-105 active:scale-95"
                        style={{ background: "var(--accent)" }}
                    >
                        Go to Feedback Form
                    </a>
                </div>
            </div>
        </div>
    );
}
