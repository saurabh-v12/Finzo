import React, { useEffect, useRef, useState } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import PixelBlast from '../components/PixelBlast';
import './Home.css';
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5173';
const Home = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState(null); // null = dropdown, 'profile', 'settings', 'about'
  const navbarRef = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    // ── Glass Surface Effect ──
    class GlassSurface {
      constructor(element, options = {}) {
        this.element = element;
        this.options = {
          width: '100%',
          height: '100%',
          borderRadius: 0,
          borderWidth: 0.07,
          brightness: 50,
          opacity: 0.93,
          blur: 11,
          displace: 0,
          backgroundOpacity: 0,
          saturation: 1,
          distortionScale: -180,
          redOffset: 0,
          greenOffset: 10,
          blueOffset: 20,
          xChannel: 'R',
          yChannel: 'G',
          mixBlendMode: 'difference',
          ...options
        };
        
        this.uniqueId = Math.random().toString(36).substr(2, 9);
        this.filterId = `glass-filter-${this.uniqueId}`;
        this.redGradId = `red-grad-${this.uniqueId}`;
        this.blueGradId = `blue-grad-${this.uniqueId}`;
        
        this.init();
      }
    
      init() {
        this.checkSvgSupport();
        this.buildStructure();
        this.setupResizeObserver();
        requestAnimationFrame(() => this.updateDisplacementMap());
        this.applyStyles();
      }
    
      checkSvgSupport() {
        const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        this.svgSupported = !(isWebkit || isFirefox);
        
        if (this.svgSupported) {
           this.element.classList.add('glass-surface--svg');
        } else {
           this.element.classList.add('glass-surface--fallback');
        }
      }
    
      buildStructure() {
        let content = this.element.querySelector('.glass-surface__content');
        if (!content) {
          content = document.createElement('div');
          content.className = 'glass-surface__content';
          // Move children into content wrapper
          while (this.element.firstChild) {
            content.appendChild(this.element.firstChild);
          }
          this.element.appendChild(content);
        }
        this.contentRef = content;
    
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "glass-surface__filter");
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        
        const filterHTML = `
          <defs>
            <filter id="${this.filterId}" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">
              <feImage result="map" preserveAspectRatio="none" x="0" y="0" width="100%" height="100%" />
              <feDisplacementMap in="SourceGraphic" in2="map" result="dispRed" 
                scale="${this.options.distortionScale + this.options.redOffset}" 
                xChannelSelector="${this.options.xChannel}" 
                yChannelSelector="${this.options.yChannel}" />
              <feColorMatrix in="dispRed" result="red" type="matrix" 
                values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
              <feDisplacementMap in="SourceGraphic" in2="map" result="dispGreen" 
                scale="${this.options.distortionScale + this.options.greenOffset}" 
                xChannelSelector="${this.options.xChannel}" 
                yChannelSelector="${this.options.yChannel}" />
              <feColorMatrix in="dispGreen" result="green" type="matrix" 
                values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" />
              <feDisplacementMap in="SourceGraphic" in2="map" result="dispBlue" 
                scale="${this.options.distortionScale + this.options.blueOffset}" 
                xChannelSelector="${this.options.xChannel}" 
                yChannelSelector="${this.options.yChannel}" />
              <feColorMatrix in="dispBlue" result="blue" type="matrix" 
                values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" />
              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
              <feGaussianBlur in="output" stdDeviation="${this.options.displace}" />
            </filter>
          </defs>
        `;
        svg.innerHTML = filterHTML;
        this.element.insertBefore(svg, content);
        this.feImage = svg.querySelector('feImage');
      }
    
      generateDisplacementMap() {
        const rect = this.element.getBoundingClientRect();
        const actualWidth = rect.width || 400;
        const actualHeight = rect.height || 200;
        const edgeSize = Math.min(actualWidth, actualHeight) * (this.options.borderWidth * 0.5);
    
        const svgContent = `
          <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="${this.redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#0000"/>
                <stop offset="100%" stop-color="red"/>
              </linearGradient>
              <linearGradient id="${this.blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#0000"/>
                <stop offset="100%" stop-color="blue"/>
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
            <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${this.options.borderRadius}" fill="url(#${this.redGradId})" />
            <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${this.options.borderRadius}" fill="url(#${this.blueGradId})" style="mix-blend-mode: ${this.options.mixBlendMode}" />
            <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${this.options.borderRadius}" fill="hsl(0 0% ${this.options.brightness}% / ${this.options.opacity})" style="filter:blur(${this.options.blur}px)" />
          </svg>
        `;
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent.trim())}`;
      }
    
      updateDisplacementMap() {
        if (this.feImage) {
          this.feImage.setAttribute('href', this.generateDisplacementMap());
        }
      }
    
      setupResizeObserver() {
        const resizeObserver = new ResizeObserver(() => {
          setTimeout(() => this.updateDisplacementMap(), 0);
        });
        resizeObserver.observe(this.element);
      }
    
      applyStyles() {
        this.element.style.setProperty('--glass-frost', this.options.backgroundOpacity);
        this.element.style.setProperty('--glass-saturation', this.options.saturation);
        this.element.style.setProperty('--filter-id', `url(#${this.filterId})`);
      }
    }

    // ── Shuffle Text Effect ──
    class ShuffleText {
      constructor(element) {
        this.element = element;
        this.originalText = element.textContent;
        this.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        this.interval = null;
        this.iteration = 0;
        
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);

        this.element.addEventListener('mouseenter', this.start);
        this.element.addEventListener('mouseleave', this.stop);
      }
      
      start() {
        this.iteration = 0;
        clearInterval(this.interval);
        
        this.interval = setInterval(() => {
          this.element.textContent = this.originalText
            .split("")
            .map((letter, index) => {
              if (index < this.iteration) {
                return this.originalText[index];
              }
              return this.chars[Math.floor(Math.random() * this.chars.length)];
            })
            .join("");
          
          if (this.iteration >= this.originalText.length) {
            clearInterval(this.interval);
          }
          
          this.iteration += 1 / 3;
        }, 30);
      }
      
      stop() {
        clearInterval(this.interval);
        this.element.textContent = this.originalText;
      }
    }

    // Init Glass Surface
    if (navbarRef.current) {
      new GlassSurface(navbarRef.current, {
        displace: 1.1,
        distortionScale: -180,
        redOffset: 0,
        greenOffset: 10,
        blueOffset: 20,
        brightness: 53,
        opacity: 1,
        mixBlendMode: 'screen'
      });
    }

    // Init Shuffle Text
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(el => {
      el.classList.add('shuffle-link');
      new ShuffleText(el);
    });

    // Navbar Scroll Effect
    const handleScroll = () => {
      if (navbarRef.current) {
        navbarRef.current.classList.toggle("scrolled", window.scrollY > 60);
      }
    };
    window.addEventListener("scroll", handleScroll);

    // ── Intersection Observer for .card and .testi-card ──
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const el = entry.target;
          const delay = (parseInt(el.dataset.delay) || 0) * 100;
          setTimeout(() => el.classList.add("visible"), delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll(".card, .testi-card").forEach(el => observer.observe(el));

    // ── Smooth card transition (set custom transition-delay) ──
    document.querySelectorAll(".card").forEach((card, i) => {
      card.style.transitionDelay = (i * 0.07) + "s";
    });
    
    // ── Staggered card transition duration sync ──
    document.querySelectorAll(".testi-card").forEach((card, i) => {
      card.style.transitionDelay = (i * 0.12) + "s";
    });

    // ── Count-up animation for stats ──
    function countUp(el, target, suffix, duration = 1800){
      const isFloat = target % 1 !== 0;
      let start = 0;
      const step = target / (duration / 16);
      const tick = () => {
        start = Math.min(start + step, target);
        el.textContent = (isFloat ? start.toFixed(2) : Math.floor(start))
          .toLocaleString("en-IN") + suffix;
        if(start < target) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    const statValues = [
      { el: document.querySelectorAll(".stat-value")[0], val: 4.2, suffix: "B+" },
      { el: document.querySelectorAll(".stat-value")[1], val: 180, suffix: "K+" },
      { el: document.querySelectorAll(".stat-value")[2], val: 99.99, suffix: "%" },
      { el: document.querySelectorAll(".stat-value")[3], val: 4.9, suffix: " ★" },
    ];

    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting){
          statValues.forEach(s => {
            if (s.el) countUp(s.el, s.val, s.suffix);
          });
          statsObserver.disconnect();
        }
      });
    }, { threshold: 0.5 });

    const statsBar = document.querySelector(".stats-bar");
    if(statsBar) statsObserver.observe(statsBar);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      statsObserver.disconnect();
    };
  }, []);

  return (
    <div className="home-page">
      {/* Avatar Button */}
      <div style={{position:'fixed', top:'16px', 
                   right:'16px', zIndex:9999}}>
        
        {/* Avatar Circle */}
        <div 
          onClick={() => setMenuOpen(!menuOpen)} 
          style={{ 
            width: '42px', height: '42px', 
            borderRadius: '50%', 
            background: '#2563eb', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white', 
            fontWeight: '700', 
            fontSize: '16px', 
            backgroundImage: user?.imageUrl ? 
              `url(${user.imageUrl})` : 'none', 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            border: '2px solid rgba(255,255,255,0.2)' 
          }} 
        > 
          {!user?.imageUrl && 
            (user?.firstName?.[0] || 'U').toUpperCase()} 
        </div>
      
        {/* Dropdown Menu */} 
        {menuOpen && view === null && ( 
          <div style={{ 
            position: 'absolute', top: '50px', right: '0', 
            background: '#1e293b', borderRadius: '12px', 
            padding: '8px', minWidth: '200px', 
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', 
            border: '1px solid rgba(255,255,255,0.1)' 
          }}> 
            {/* User Info Header */} 
            <div style={{padding: '12px', borderBottom: 
                         '1px solid rgba(255,255,255,0.1)', 
                         marginBottom: '8px'}}> 
              <div style={{color:'white', fontWeight:'600', 
                           fontSize:'14px'}}> 
                {user?.fullName || user?.firstName} 
              </div> 
              <div style={{color:'#94a3b8', fontSize:'12px'}}> 
                {user?.primaryEmailAddress?.emailAddress} 
              </div> 
            </div> 
      
            {/* Menu Items */} 
            {[ 
              { label: '👤  Profile', view: 'profile' }, 
              { label: '⚙️  Settings', view: 'settings' }, 
              { label: 'ℹ️  About', view: 'about' }, 
            ].map(item => ( 
              <div 
                key={item.view} 
                onClick={() => setView(item.view)} 
                style={{ 
                  padding: '10px 12px', borderRadius: '8px', 
                  color: 'white', cursor: 'pointer', 
                  fontSize: '14px', 
                  transition: 'background 0.2s' 
                }} 
                onMouseEnter={e => 
                  e.target.style.background='rgba(255,255,255,0.1)'} 
                onMouseLeave={e => 
                  e.target.style.background='transparent'} 
              > 
                {item.label} 
              </div> 
            ))} 
      
            <div style={{borderTop:'1px solid rgba(255,255,255,0.1)', 
                         marginTop:'8px', paddingTop:'8px'}}> 
              <div 
                onClick={() => signOut(() => 
                  window.location.href = '/login')} 
                style={{ 
                  padding: '10px 12px', borderRadius: '8px', 
                  color: '#ef4444', cursor: 'pointer', 
                  fontSize: '14px' 
                }} 
                onMouseEnter={e => 
                  e.target.style.background='rgba(239,68,68,0.1)'} 
                onMouseLeave={e => 
                  e.target.style.background='transparent'} 
              > 
                🚪  Logout 
              </div> 
            </div> 
          </div> 
        )} 
      
        {/* Profile Modal */} 
        {view === 'profile' && ( 
          <div style={{ 
            position:'fixed', top:0, left:0, 
            width:'100vw', height:'100vh', 
            background:'rgba(0,0,0,0.6)', 
            display:'flex', alignItems:'center', 
            justifyContent:'center', zIndex:99999 
          }}> 
            <div style={{ 
              background:'#1e293b', borderRadius:'16px', 
              padding:'32px', width:'400px', 
              border:'1px solid rgba(255,255,255,0.1)' 
            }}> 
              <h2 style={{color:'white', marginBottom:'24px', 
                          fontFamily:'Syne, sans-serif'}}> 
                Profile 
              </h2> 
              
              {/* Avatar */} 
              <div style={{textAlign:'center', 
                           marginBottom:'24px'}}> 
                <div style={{ 
                  width:'80px', height:'80px', 
                  borderRadius:'50%', background:'#2563eb', 
                  margin:'0 auto 12px', 
                  backgroundImage: user?.imageUrl ? 
                    `url(${user.imageUrl})` : 'none', 
                  backgroundSize:'cover', 
                  display:'flex', alignItems:'center', 
                  justifyContent:'center', 
                  color:'white', fontSize:'32px', 
                  fontWeight:'700' 
                }}> 
                  {!user?.imageUrl && 
                    (user?.firstName?.[0] || 'U').toUpperCase()} 
                </div> 
              </div> 
      
              {/* Info Fields */} 
              {[ 
                { label: 'Full Name', 
                  value: user?.fullName || '-' }, 
                { label: 'Email', 
                  value: user?.primaryEmailAddress 
                             ?.emailAddress || '-' }, 
                { label: 'Member Since', 
                  value: user?.createdAt ? 
                    new Date(user.createdAt) 
                      .toLocaleDateString('en-IN') : '-' }, 
                { label: 'Account ID', 
                  value: user?.id?.slice(0,16) + '...' || '-' }, 
              ].map(field => ( 
                <div key={field.label} style={{ 
                  marginBottom:'16px', 
                  padding:'12px', 
                  background:'rgba(255,255,255,0.05)', 
                  borderRadius:'8px' 
                }}> 
                  <div style={{color:'#94a3b8', 
                               fontSize:'12px', 
                               marginBottom:'4px'}}> 
                    {field.label} 
                  </div> 
                  <div style={{color:'white', fontSize:'14px'}}> 
                    {field.value} 
                  </div> 
                </div> 
              ))} 
      
              <button 
                onClick={() => { setView(null); 
                                 setMenuOpen(false); }} 
                style={{ 
                  width:'100%', padding:'12px', 
                  background:'#2563eb', color:'white', 
                  border:'none', borderRadius:'8px', 
                  cursor:'pointer', marginTop:'8px', 
                  fontFamily:'DM Sans, sans-serif' 
                }} 
              > 
                Close 
              </button> 
            </div> 
          </div> 
        )} 
      
        {/* Settings Modal */} 
        {view === 'settings' && ( 
          <div style={{ 
            position:'fixed', top:0, left:0, 
            width:'100vw', height:'100vh', 
            background:'rgba(0,0,0,0.6)', 
            display:'flex', alignItems:'center', 
            justifyContent:'center', zIndex:99999 
          }}> 
            <div style={{ 
              background:'#1e293b', borderRadius:'16px', 
              padding:'32px', width:'400px', 
              border:'1px solid rgba(255,255,255,0.1)' 
            }}> 
              <h2 style={{color:'white', marginBottom:'24px', 
                          fontFamily:'Syne, sans-serif'}}> 
                Settings 
              </h2> 
      
              {[ 
                { label: 'Notifications', 
                  desc: 'Get alerts for upcoming payments' }, 
                { label: 'Dark Mode', 
                  desc: 'App uses dark theme by default' }, 
                { label: 'Auto-generate Insights', 
                  desc: 'Generate insights after each upload' }, 
                { label: 'Currency', 
                  desc: 'Indian Rupee (₹ INR)' }, 
              ].map(setting => ( 
                <div key={setting.label} style={{ 
                  display:'flex', justifyContent:'space-between', 
                  alignItems:'center', padding:'16px', 
                  background:'rgba(255,255,255,0.05)', 
                  borderRadius:'8px', marginBottom:'12px' 
                }}> 
                  <div> 
                    <div style={{color:'white', fontSize:'14px', 
                                 fontWeight:'500'}}> 
                      {setting.label} 
                    </div> 
                    <div style={{color:'#94a3b8', fontSize:'12px'}}> 
                      {setting.desc} 
                    </div> 
                  </div> 
                  <div style={{ 
                    width:'40px', height:'22px', 
                    background:'#2563eb', borderRadius:'99px', 
                    cursor:'pointer' 
                  }} /> 
                </div> 
              ))} 
      
              <button 
                onClick={() => { setView(null); 
                                 setMenuOpen(false); }} 
                style={{ 
                  width:'100%', padding:'12px', 
                  background:'#2563eb', color:'white', 
                  border:'none', borderRadius:'8px', 
                  cursor:'pointer', marginTop:'8px', 
                  fontFamily:'DM Sans, sans-serif' 
                }} 
              > 
                Close 
              </button> 
            </div> 
          </div> 
        )} 
      
        {/* About Modal */} 
        {view === 'about' && ( 
          <div style={{ 
            position:'fixed', top:0, left:0, 
            width:'100vw', height:'100vh', 
            background:'rgba(0,0,0,0.6)', 
            display:'flex', alignItems:'center', 
            justifyContent:'center', zIndex:99999 
          }}> 
            <div style={{ 
              background:'#1e293b', borderRadius:'16px', 
              padding:'32px', width:'400px', 
              border:'1px solid rgba(255,255,255,0.1)', 
              textAlign:'center' 
            }}> 
              <div style={{fontSize:'48px', 
                           marginBottom:'16px'}}>💰</div> 
              <h2 style={{color:'white', marginBottom:'8px', 
                          fontFamily:'Syne, sans-serif', 
                          fontSize:'24px'}}> 
                Finzo 
              </h2> 
              <p style={{color:'#94a3b8', fontSize:'14px', 
                         marginBottom:'24px'}}> 
                Version 1.0.0 · NAVONMESH 2026 
              </p> 
              <p style={{color:'#cbd5e1', fontSize:'14px', 
                         lineHeight:'1.6', marginBottom:'24px'}}> 
                AI-powered personal finance tracker. 
                Upload your bank statement and get instant 
                insights powered by Google Gemini. 
              </p> 
              <div style={{ 
                background:'rgba(255,255,255,0.05)', 
                borderRadius:'8px', padding:'16px', 
                marginBottom:'24px', textAlign:'left' 
              }}> 
                {[ 
                  { label: 'Built by', value: 'Saurabh Vishwakarma' }, 
                  { label: 'AI', value: 'Google Gemini 2.0 Flash' }, 
                  { label: 'Auth', value: 'Clerk' }, 
                  { label: 'Backend', value: 'FastAPI + SQLite' }, 
                ].map(item => ( 
                  <div key={item.label} style={{ 
                    display:'flex', justifyContent:'space-between', 
                    marginBottom:'8px' 
                  }}> 
                    <span style={{color:'#94a3b8', fontSize:'13px'}}> 
                      {item.label} 
                    </span> 
                    <span style={{color:'white', fontSize:'13px'}}> 
                      {item.value} 
                    </span> 
                  </div> 
                ))} 
              </div> 
              <button 
                onClick={() => { setView(null); 
                                 setMenuOpen(false); }} 
                style={{ 
                  width:'100%', padding:'12px', 
                  background:'#2563eb', color:'white', 
                  border:'none', borderRadius:'8px', 
                  cursor:'pointer', 
                  fontFamily:'DM Sans, sans-serif' 
                }} 
              > 
                Close 
              </button> 
            </div> 
          </div> 
        )} 
      </div>

      {/* ═══ NAVBAR ═══ */}
      <nav id="navbar" className="glass-surface" ref={navbarRef}>
        <div className="nav-logo">Finzo<span>.</span></div>
        <ul className="nav-links" style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '32px',
          alignItems: 'center',
          margin: 0,
          padding: 0
        }}>
          <li><a href="#services">Services</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#testimonials">Reviews</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      <main>
        {/* ═══ HERO ═══ */}
        <section className="hero" ref={heroRef}>
          <video autoPlay muted loop playsInline poster="">
            <source src="https://wyivwhabot.ufs.sh/f/LmrPcfHn2XAUZpXjiHYkCPLcrmfX7xvRKWOj8wlMINSiF1y2" type="video/mp4" />
          </video>
          <div className="hero-overlay"></div>

          <div className="hero-content">
            <h1 className="hero-title">
              One Solution to All Your<br/><em>Financial Problems</em>
            </h1>
            <p className="hero-sub">
              Manage taxes, loans, statements and more — all from one intelligent dashboard built for modern India.
            </p>
            <div className="hero-actions">
            <a href={`${DASHBOARD_URL}`} className="btn-primary">Explore Services</a>
              <a href="#how-it-works" className="btn-outline">How It Works</a>
            </div>
          </div>
        </section>

        {/* ═══ STATS BAR ═══ */}
        <div className="stats-bar">
          <div className="stats-inner">
            <div className="stat-item">
              <div>
                <div className="stat-value">4.2B+</div>
                <div className="stat-label">Assets Managed</div>
              </div>
            </div>
            <div className="stat-item">
              <div>
                <div className="stat-value">180K+</div>
                <div className="stat-label">Active Users</div>
              </div>
            </div>
            <div className="stat-item">
              <div>
                <div className="stat-value">99.99%</div>
                <div className="stat-label">Uptime SLA</div>
              </div>
            </div>
            <div className="stat-item">
              <div>
                <div className="stat-value">4.9 ★</div>
                <div className="stat-label">App Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SERVICES ═══ */}
        <div style={{
          position:'relative',
          overflow:'hidden',
          width:'100%',
          background:'var(--bg)'
        }}>
          {/* PixelBlast fills full width */}
          <div style={{
            position:'absolute',
            top:0,
            left:0,
            width:'100%',
            height:'100%',
            zIndex:0,
            pointerEvents:'none'
          }}>
            <PixelBlast
              color="#b7ff00"
              variant="square"
              pixelSize={3}
              enableRipples={true}
              speed={0.7}
              edgeFade={0.25}
              patternDensity={1.2}
              patternScale={4}
              transparent={true}
            />
          </div>

          {/* Services content on top */}
          <section className="services" id="services" style={{position:'relative', zIndex:1}}>
            <div className="services-header">
              <p className="section-tag">Services</p>
              <h2 className="section-head">Choose Your Query Type</h2>
            </div>

            <div className="cards-grid">
              <div className="card" data-delay="0" id="card-1" onClick={() => window.location.href=`${DASHBOARD_URL}`}>
                <div className="card-icon">🧾</div>
                <div className="card-title">Tax Records</div>
                <div className="card-desc">File and track ITR, view Form 16, AIS, and get AI-powered deduction suggestions.</div>
                <div className="card-arrow">Explore →</div>
              </div>
              <div className="card" data-delay="1" id="card-2" onClick={() => window.location.href=`${DASHBOARD_URL}`}>
                <div className="card-icon">🏦</div>
                <div className="card-title">Bank Statements</div>
                <div className="card-desc">Aggregate statements from all your banks, auto-categorise transactions and spot anomalies.</div>
                <div className="card-arrow">Explore →</div>
              </div>
              <div className="card" data-delay="2" id="card-3" onClick={() => window.location.href=`${DASHBOARD_URL}`}>
                <div className="card-icon">📲</div>
                <div className="card-title">UPI Transactions</div>
                <div className="card-desc">Full UPI history across apps — PhonePe, GPay, Paytm — in one unified view.</div>
                <div className="card-arrow">Explore →</div>
              </div>
              <div className="card" data-delay="3" id="card-4" onClick={() => window.location.href=`${DASHBOARD_URL}`}>
                <div className="card-icon">💳</div>
                <div className="card-title">Credit Card Bills</div>
                <div className="card-desc">Track due dates, minimum payments, rewards points and optimise spending limits.</div>
                <div className="card-arrow">Explore →</div>
              </div>
              <div className="card" data-delay="4" id="card-5" onClick={() => window.location.href=`${DASHBOARD_URL}`}>
                <div className="card-icon">🏠</div>
                <div className="card-title">Loan Documents</div>
                <div className="card-desc">Manage home, personal and auto loans. Track EMIs, prepayments and interest savings.</div>
                <div className="card-arrow">Explore →</div>
              </div>
              <div className="card" data-delay="5" id="card-6" onClick={() => window.location.href=`${DASHBOARD_URL}`}>
                <div className="card-icon">📄</div>
                <div className="card-title">Invoices</div>
                <div className="card-desc">Generate GST-compliant invoices, manage B2B billing, and automate payment reminders.</div>
                <div className="card-arrow">Explore →</div>
              </div>
            </div>
          </section>
        </div>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="features" id="how-it-works">
          <div className="features-inner">

            <div className="features-visual" aria-hidden="true">
              <div className="feat-card">
                <div className="feat-card-label">Portfolio Value</div>
                <div className="feat-card-val">₹18,42,500</div>
                <div className="feat-card-sub">▲ +8.4% this month</div>
                <div className="feat-bar"><div className="feat-bar-fill" style={{'--w': '72%'}}></div></div>
              </div>
              <div className="feat-card">
                <div className="feat-card-label">Credit Score</div>
                <div className="feat-card-val">792</div>
                <div className="feat-card-sub">▲ Excellent</div>
                <div className="feat-bar"><div className="feat-bar-fill" style={{'--w': '85%'}}></div></div>
              </div>
              <div className="feat-card">
                <div className="feat-card-label">Monthly Savings</div>
                <div className="feat-card-val">₹32,000</div>
                <div className="feat-card-sub">▲ +12% vs last month</div>
                <div className="feat-bar"><div className="feat-bar-fill" style={{'--w': '60%'}}></div></div>
              </div>
            </div>

            <div>
              <p className="section-tag">How It Works</p>
              <h2 className="section-head">Three steps to financial clarity</h2>
              <div className="steps" style={{marginTop: '40px'}}>
                <div className="step">
                  <div className="step-num">01</div>
                  <div>
                    <div className="step-title">Connect Your Accounts</div>
                    <div className="step-desc">Securely link your banks, UPI apps, and credit cards with bank-grade 256-bit encryption. Takes under 2 minutes.</div>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">02</div>
                  <div>
                    <div className="step-title">AI Analyses Your Finances</div>
                    <div className="step-desc">Our intelligent engine auto-categorises transactions, detects anomalies, and flags opportunities to save more.</div>
                  </div>
                </div>
                <div className="step">
                  <div className="step-num">03</div>
                  <div>
                    <div className="step-title">Act on Smart Insights</div>
                    <div className="step-desc">Get personalised recommendations — from tax savings to loan prepayment strategies — all in plain English.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section className="testimonials" id="testimonials">
          <p className="section-tag">Testimonials</p>
          <h2 className="section-head">Loved by 180,000+ users</h2>

          <div className="testi-grid">
            <div className="testi-card">
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text">"Finzo saved me ₹68,000 in taxes this year by catching deductions I'd completely missed. The AI suggestions are genuinely impressive."</p>
              <div className="testi-author">
                <div className="testi-avatar">A</div>
                <div>
                  <div className="testi-name">Arjun Mehta</div>
                  <div className="testi-role">Software Engineer, Pune</div>
                </div>
              </div>
            </div>
            <div className="testi-card">
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text">"Managing invoices for my 3 businesses used to be a nightmare. Now I do it all in Finzo in under 10 minutes a month."</p>
              <div className="testi-author">
                <div className="testi-avatar" style={{background: 'linear-gradient(135deg,#059669,#10b981)'}}>P</div>
                <div>
                  <div className="testi-name">Priya Sharma</div>
                  <div className="testi-role">Business Owner, Mumbai</div>
                </div>
              </div>
            </div>
            <div className="testi-card">
              <div className="testi-stars">★★★★★</div>
              <p className="testi-text">"Credit score jumped from 680 to 792 in 8 months following Finzo's step-by-step recommendations. Life-changing platform."</p>
              <div className="testi-author">
                <div className="testi-avatar" style={{background: 'linear-gradient(135deg,#d97706,#f59e0b)'}}>R</div>
                <div>
                  <div className="testi-name">Rahul Desai</div>
                  <div className="testi-role">Chartered Accountant, Bangalore</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CTA BANNER ═══ */}
        <div className="cta-banner">
          <h2>Ready to Take Control of<br/>Your Finances?</h2>
          <p>Join over 180,000 Indians already growing smarter with Finzo.</p>
          <div className="cta-actions">
            <a href={`${DASHBOARD_URL}`} className="btn-primary">Start for Free →</a>
            <a href="mailto:saurabhkarma2004@gmail.com" className="btn-outline">Talk to Us</a>
          </div>
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer id="contact">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="nav-logo" style={{fontSize: '22px'}}>Finzo<span style={{color: '#38bdf8'}}>.</span></div>
              <p>Smart wealth. Seamless security. Limitless growth. India's most trusted financial management platform.</p>
              <div style={{marginTop: '20px', fontSize: '14px', color: '#4e7499'}}>
                <div>📞 +91 9579054962</div>
                <div style={{marginTop: '6px'}}>✉️ saurabhkarma2004@gmail.com</div>
                <div style={{marginTop: '6px'}}>🏢 123 Finance Street, Pune, MH 411033</div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Finzo Technologies Pvt. Ltd. All rights reserved.</span>
            <div className="footer-socials">
              <a className="social-btn" href="#" title="Twitter">𝕏</a>
              <a className="social-btn" href="#" title="LinkedIn">in</a>
              <a className="social-btn" href="#" title="Instagram">IG</a>
              <a className="social-btn" href="#" title="YouTube">▶</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
