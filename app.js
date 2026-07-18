const { useState, useEffect, useRef, useCallback, useMemo } = React;

const PAGE_TITLES = {
  home: 'Azumi Analytics — Data & AI Consultancy in Nairobi, Kenya',
  services: 'Our Expertise — Azumi Analytics',
  contact: 'Contact Us — Azumi Analytics'
};

const VALID_PAGES = ['home', 'services', 'contact'];

function pageFromHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  return VALID_PAGES.includes(hash) ? hash : 'home';
}

// ====== CUSTOM HOOKS ======
function useCounter(target, active, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = Math.max(target / 60, 0.5);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.round(start));
      if (start >= target) clearInterval(timer);
    }, duration / 60);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return active ? count : 0;
}

function useInView(ref, options = { threshold: 0.1, triggerOnce: true }) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (options.triggerOnce) observer.disconnect();
        }
      },
      { threshold: options.threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options.threshold, options.triggerOnce]);
  return isVisible;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e) => setReduced(e.matches);
    mq.addEventListener ? mq.addEventListener('change', listener) : mq.addListener(listener);
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', listener) : mq.removeListener(listener);
    };
  }, []);
  return reduced;
}

// ====== FOOTER PARTICLES ======
// Pauses off-screen and respects prefers-reduced-motion to avoid burning CPU/battery.
function FooterParticles() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const inView = useInView(wrapperRef, { threshold: 0, triggerOnce: false });
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;
    if (!inView) return;

    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    let width = parent.offsetWidth;
    let height = parent.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    let rafId;

    const particles = [];
    const particleCount = Math.min(50, Math.floor(width / 25));
    const colors = [
      { r: 242, g: 153, b: 74 },
      { r: 27, g: 107, b: 158 },
      { r: 58, g: 139, b: 191 },
      { r: 255, g: 255, b: 255 }
    ];

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2.5 + 1.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.25 + 0.15;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.pulse = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.015 + Math.random() * 0.015;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += this.pulseSpeed;
        if (this.x > width) this.x = 0;
        if (this.x < 0) this.x = width;
        if (this.y > height) this.y = 0;
        if (this.y < 0) this.y = height;
      }
      draw() {
        const pulseFactor = 0.7 + 0.3 * Math.sin(this.pulse);
        const currentSize = this.size * pulseFactor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, currentSize * 2.5
        );
        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity * 1.2})`);
        gradient.addColorStop(0.5, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity * 0.6})`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.1)`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => { p.update(); p.draw(); });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const opacity = 0.1 * (1 - dist / 140);
            const color = particles[i].color;
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      rafId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      width = parent.offsetWidth;
      height = parent.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [inView, reducedMotion]);

  return (
    <div ref={wrapperRef} style={{ position: 'absolute', inset: 0 }}>
      {!reducedMotion && <canvas ref={canvasRef} className="footer-particle-bg" aria-hidden="true" />}
    </div>
  );
}

// ====== ANIMATED SECTION WRAPPER ======
function AnimatedSection({ children, className = '', delay = 0, isActive = true }) {
  const ref = useRef(null);
  const isVisible = useInView(ref);

  // If section is not active (page not visible), keep it hidden
  if (!isActive) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      ref={ref} 
      className={`fade-up ${isVisible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ====== HERO SLIDER ======
function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const reducedMotion = usePrefersReducedMotion();
  const slides = [
    { img: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=600&fit=crop&auto=format&q=80', icon: 'Advisory', title: 'Strategic Data Consulting', desc: 'Clear-eyed strategy and roadmap' },
    { img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&auto=format&q=80', icon: 'Analytics', title: 'Interactive Dashboards & BI', desc: 'Real-time insights that answer real questions' },
    { img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop&auto=format&q=80', icon: 'Collection', title: 'Field-Ready Data Collection', desc: 'Built for local conditions' },
    { img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop&auto=format&q=80', icon: 'Engineering', title: 'Scalable Data Pipelines', desc: 'Infrastructure that grows with you' },
    { img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&auto=format&q=80', icon: 'Quality', title: 'Trustworthy Data Management', desc: 'Clean, reliable data' },
    { img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&auto=format&q=80', icon: 'Training', title: 'Data Literacy & Enablement', desc: 'Building a data-driven culture' },
    { img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&auto=format&q=80', icon: 'AI/ML', title: 'Practical Artificial Intelligence', desc: 'Predictive models that do the thinking' },
    { img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=600&fit=crop&auto=format&q=80', icon: 'NLP', title: 'Natural Language Understanding', desc: 'Uncover what customers are saying' },
    { img: 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&h=600&fit=crop&auto=format&q=80', icon: 'Automation', title: 'Intelligent Process Automation', desc: 'Hand off repetitive work' }
  ];

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, [slides.length, reducedMotion]);

  return (
    <div className="hero-slider" role="region" aria-label="Our services, in pictures" aria-live="off">
      {slides.map((slide, i) => (
        <div key={i} className={`hero-slide ${i === current ? 'active' : ''}`} aria-hidden={i !== current}>
          <img src={slide.img} alt={slide.title} loading="lazy" />
          <div className="slide-overlay">
            <span className="slide-icon">{slide.icon}</span>
            <h4>{slide.title}</h4>
            <p>{slide.desc}</p>
          </div>
        </div>
      ))}
      <div className="hero-slider-controls">
        {slides.map((_, i) => (
          <button
            key={i}
            className={i === current ? 'active' : ''}
            onClick={() => setCurrent(i)}
            aria-label={`Show slide ${i + 1} of ${slides.length}: ${slides[i].title}`}
            aria-current={i === current}
          />
        ))}
      </div>
    </div>
  );
}

// ====== FLOATING METRICS ======
function FloatingMetrics() {
  return (
    <div className="floating-metrics" aria-hidden="true">
      <div className="float-card"><i className="fas fa-folder-open"></i> <span>+60</span> Projects</div>
      <div className="float-card"><i className="fas fa-smile"></i> <span>98%</span> Client Satisfaction</div>
      <div className="float-card"><i className="fas fa-code"></i> <span>20+</span> Technologies</div>
      <div className="float-card"><i className="fas fa-brain"></i> <span>AI</span> Powered Solutions</div>
    </div>
  );
}

// ====== ANIMATED NUMBERS ======
// Hooks are now called unconditionally (fixes a Rules-of-Hooks violation in the
// original, where useCounter was invoked inside a ternary).
function AnimatedNumbers({ isActive }) {
  const years = useCounter(5, isActive);
  const projects = useCounter(60, isActive);
  const tools = useCounter(20, isActive);
  const engagements = useCounter(15, isActive);

  return (
    <div className="numbers" id="numbersBand">
      <div className="number-item">
        <h3>{years}</h3>
        <p>Years Team Experience</p>
      </div>
      <div className="number-item">
        <h3>{projects}+</h3>
        <p>Projects Delivered</p>
      </div>
      <div className="number-item">
        <h3>{tools}+</h3>
        <p>Tools in Our Stack</p>
      </div>
      <div className="number-item">
        <h3>{engagements}+</h3>
        <p>Client Engagements</p>
      </div>
    </div>
  );
}

// ====== AI CHAT ======
// Clearly-labeled demo assistant: canned responses, no live backend. Kept
// lightweight and honest about what it is so visitors aren't misled.
function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi, I'm the Azumi demo assistant. Ask me about analytics, AI, or automation — for a real project inquiry, please use the contact form.", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { text: input.trim(), sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    window.setTimeout(() => {
      const responses = [
        "We specialize in helping businesses turn data into revenue through analytics and AI.",
        "Our team can build custom dashboards that answer your specific business questions.",
        "We've helped 60+ clients automate processes and deploy practical AI solutions.",
        "Would you like to book a free consultation to discuss your project? Use the contact form and we'll reply within 24 hours.",
        "We work with startups, NGOs, and enterprises across Africa and beyond."
      ];
      const aiMsg = { text: responses[Math.floor(Math.random() * responses.length)], sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
      <button
        className="chat-toggle"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
      >
        <span className="pulse-ring" aria-hidden="true"></span>
        <i className="fas fa-comment-dots" aria-hidden="true"></i>
        {!isOpen && <span className="notification-badge" aria-hidden="true">1</span>}
      </button>
      {isOpen && (
        <div className="chat-container" role="dialog" aria-label="Azumi demo assistant">
          <div className="chat-header">
            <div>
              <h4>Azumi Assistant (demo)</h4>
              <p>Ask about data, analytics, or automation</p>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
          <div className="chat-messages" role="log" aria-live="polite">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.sender}`}>
                <p>{msg.text}</p>
              </div>
            ))}
            {isTyping && (
              <div className="message ai">
                <div className="typing-indicator"><span></span><span></span><span></span></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input">
            <label htmlFor="chatInput" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
              Type a message
            </label>
            <input
              id="chatInput"
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question..."
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            />
            <button onClick={handleSend} disabled={!input.trim()} aria-label="Send message">
              <i className="fas fa-paper-plane" aria-hidden="true"></i>
            </button>
          </div>
          <p className="chat-disclaimer">Demo assistant with scripted replies — not connected to a live model.</p>
        </div>
      )}
    </div>
  );
}

// ====== SMART CONTACT FORM ======
// Fixed: previously "suggestions" injected sales copy into the visitor's own
// message field, which read like the form was talking over the visitor. This
// version shows relevant talking points as a read-only aside instead. It also
// actually delivers the message (via a mailto handoff) rather than only
// setting local state, since there was no real submission path before.
function SmartContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const topicHints = {
    dashboard: 'We build interactive dashboards with real-time data.',
    automation: 'Our RPA solutions can automate repetitive tasks.',
    ai: 'We implement predictive models trained on your own data.',
    analytics: 'Our analytics team surfaces insights you may not have found yet.',
    data: 'We cover end-to-end data work, from collection to visualization.',
    machine: 'Our machine learning models are built for practical business outcomes.'
  };

  const matchedHints = useMemo(() => {
    const text = formData.message.toLowerCase();
    return Object.entries(topicHints).filter(([key]) => text.includes(key));
  }, [formData.message]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in your name, email and message.');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // No backend is wired up yet, so hand the message to the visitor's own
    // mail client as a working fallback. Replace this with a real form
    // endpoint (e.g. your own API, or a service like Formspree) when ready.
    const subject = encodeURIComponent(`New inquiry from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    );
    window.location.href = `mailto:info@azumianalytics.co.ke?subject=${subject}&body=${body}`;

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="form-success show" role="status">
        <strong>✓ Your email app should now be open with your message pre-filled.</strong>
        <p>If nothing opened, email us directly at <a href="mailto:info@azumianalytics.co.ke">info@azumianalytics.co.ke</a>.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {error && <div className="form-error-banner" role="alert">{error}</div>}

      <label htmlFor="name">Your Name <span className="required">*</span></label>
      <input
        type="text" id="name" name="name" placeholder="Jane Wanjiru" required
        value={formData.name}
        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
      />

      <label htmlFor="email">Email Address <span className="required">*</span></label>
      <input
        type="email" id="email" name="email" placeholder="jane@example.com" required
        value={formData.email}
        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
      />

      <label htmlFor="message">Message <span className="required">*</span></label>
      <textarea
        id="message" name="message" rows="4" placeholder="Tell us about your project..." required
        value={formData.message}
        onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
      />

      {matchedHints.length > 0 && (
        <div className="ai-suggestions" aria-live="polite">
          <h4>You might be interested in</h4>
          <ul className="hint-list">
            {matchedHints.map(([key, text]) => (
              <li key={key}>
                <span className="badge">{key}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit" className="btn-primary">
        Send Message <i className="fas fa-paper-plane" style={{ marginLeft: '8px' }} aria-hidden="true"></i>
      </button>
    </form>
  );
}

// ====== TOOLS DATA ======
const toolsData = [
  { name: 'MS SQL', icon: 'fa-database', color: '#CC2927' },
  { name: 'MySQL', icon: 'fa-database', color: '#00758F' },
  { name: 'PostgreSQL', icon: 'fa-database', color: '#336791' },
  { name: 'Python', icon: 'fa-python', color: '#3776AB' },
  { name: 'Power BI', icon: 'fa-chart-bar', color: '#F2C811' },
  { name: 'Tableau', icon: 'fa-chart-pie', color: '#E97627' },
  { name: 'Excel', icon: 'fa-file-excel', color: '#217346' },
  { name: 'AWS', icon: 'fa-aws', color: '#FF9900' },
  { name: 'Azure', icon: 'fa-microsoft', color: '#0078D4' },
  { name: 'GCP', icon: 'fa-cloud', color: '#4285F4' },
  { name: 'Docker', icon: 'fa-docker', color: '#2496ED' },
  { name: 'Spark', icon: 'fa-bolt', color: '#E25A1C' },
  { name: 'Airflow', icon: 'fa-wind', color: '#017CEE' },
  { name: 'Looker', icon: 'fa-eye', color: '#4285F4' },
  { name: 'Jupyter', icon: 'fa-book', color: '#F37626' },
  { name: 'KoboToolbox', icon: 'fa-toolbox', color: '#0a6b5e', custom: true, label: 'K' },
  { name: 'Fabric', icon: 'fa-cubes', color: '#175D82', custom: true, label: 'F' },
  { name: 'SurveyCTO', icon: 'fa-clipboard', color: '#2c3e50', custom: true, label: 'S' },
  { name: 'DuckDB', icon: 'fa-database', color: '#FF6B00' },
  { name: 'R', icon: 'fa-r-project', color: '#276DC3' },
  { name: 'dbt', icon: 'fa-database', color: '#FF694B' }
];

// ====== MAIN APP ======
function App() {
  const [activePage, setActivePage] = useState(pageFromHash());

  // Hash-based routing: pages are now bookmarkable/shareable and the back
  // button works, and the tab title updates per page (both missing before).
  useEffect(() => {
    const onHashChange = () => setActivePage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.title = PAGE_TITLES[activePage] || PAGE_TITLES.home;
  }, [activePage]);

  const navigateTo = (page) => {
    if (window.location.hash !== `#/${page}`) {
      window.location.hash = `/${page}`;
    } else {
      setActivePage(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const expertiseCards = [
    { icon: 'fa-handshake', bg: '#5B6B78', title: 'Data Strategy Advisory', desc: 'A clear-eyed data strategy and roadmap.' },
    { icon: 'fa-chart-line', bg: '#F2994A', title: 'Analytics & Visualization', desc: 'Dashboards and reports people actually open.' },
    { icon: 'fa-clipboard-list', bg: '#2E9E8B', title: 'Data Collection', desc: 'Field-ready survey design and real-time capture.' },
    { icon: 'fa-database', bg: '#175D82', title: 'Data Engineering', desc: 'Pipelines and warehouses that scale.' },
    { icon: 'fa-check-circle', bg: '#C1443D', title: 'Data Quality Management', desc: 'Clean, trustworthy data for every decision.' },
    { icon: 'fa-chalkboard-teacher', bg: '#8A6FBF', title: 'Training & Enablement', desc: 'Data literacy that sticks after we leave.' },
    { icon: 'fa-robot', bg: '#F2994A', title: 'AI & Machine Learning', desc: 'Predictive models and automation.' },
    { icon: 'fa-comment-dots', bg: '#2E9E8B', title: 'Natural Language Processing', desc: 'Understand what customers are really saying.' },
    { icon: 'fa-cogs', bg: '#C1443D', title: 'Intelligent Automation', desc: 'Hand off repetitive work to focus on what matters.' }
  ];

  const servicesDetailed = [
    { img: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=400&fit=crop&auto=format&q=80', icon: 'fa-handshake', bg: '#5B6B78', title: 'Data Strategy Advisory', items: ['Data strategy & roadmapping', 'Digital modernisation', 'Readiness & maturity assessment', 'Blueprint architecture', 'Business analysis & value mapping'] },
    { img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&auto=format&q=80', icon: 'fa-chart-line', bg: '#F2994A', title: 'Analytics & Visualization', items: ['BI strategy & roadmapping', 'KPI design & performance tracking', 'Predictive & diagnostic analytics', 'Interactive dashboards & reporting', 'Infographic-based data storytelling'] },
    { img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop&auto=format&q=80', icon: 'fa-clipboard-list', bg: '#2E9E8B', title: 'Data Collection', items: ['Survey design & instrumentation', 'Multi-source data integration', 'Real-time data ingestion', 'IoT & sensor data collection', 'Data validation & enrichment', 'Web Data Collection'] },
    { img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop&auto=format&q=80', icon: 'fa-database', bg: '#175D82', title: 'Data Engineering', items: ['Data architecture & modeling', 'Data warehouse & lake design', 'ETL/ELT pipeline development', 'Cloud infrastructure (AWS, Azure, GCP)', 'Real-time & batch processing'] },
    { img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&auto=format&q=80', icon: 'fa-check-circle', bg: '#C1443D', title: 'Data Quality Management', items: ['Data profiling & auditing', 'Cleansing & standardization', 'Master data management (MDM)', 'Validation automation', 'Quality monitoring dashboards'] },
    { img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop&auto=format&q=80', icon: 'fa-chalkboard-teacher', bg: '#8A6FBF', title: 'Training & Enablement', items: ['Data literacy programs', 'Analytics tools training', 'Custom workshops & enablement', 'Executive data strategy coaching', 'Building a data-driven culture'] },
    { img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&auto=format&q=80', icon: 'fa-robot', bg: '#F2994A', title: 'AI & Machine Learning', items: ['Predictive modeling & forecasting', 'Computer vision & image analysis', 'Anomaly & fraud detection', 'Recommendation engines', 'Automated machine learning (AutoML)'] },
    { img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop&auto=format&q=80', icon: 'fa-comment-dots', bg: '#2E9E8B', title: 'Natural Language Processing', items: ['Text classification & categorization', 'Sentiment & emotion analysis', 'Named entity recognition (NER)', 'Chatbots & conversational AI', 'Language translation & summarization'] },
    { img: 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=600&h=400&fit=crop&auto=format&q=80', icon: 'fa-cogs', bg: '#C1443D', title: 'Intelligent Automation', items: ['Robotic process automation (RPA)', 'Workflow & business process automation', 'Process mining & optimization', 'AI operations (AIOps)', 'Smart document & content processing'] }
  ];

  return (
    <>
      <AIChat />

      <div className="container" id="main-content">
        {/* Navbar */}
        <nav className="navbar" aria-label="Primary">
          <a href="#/home" className="logo-container" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>
            <img src="https://i.postimg.cc/T3pMK5bj/azumi-analytics.jpg" alt="Azumi Analytics logo" className="logo-img" />
            <div className="logo-text-wrapper">
              <div className="logo-text">Azumi<span>Analytics</span></div>
              <span className="small">Data &amp; AI Consultancy</span>
            </div>
          </a>
          <div className="nav-links">
            <button className="nav-link" aria-current={activePage === 'home' ? 'page' : undefined} onClick={() => navigateTo('home')}>Home</button>
            <button className="nav-link" aria-current={activePage === 'services' ? 'page' : undefined} onClick={() => navigateTo('services')}>Our Expertise</button>
            <button className="nav-link" aria-current={activePage === 'contact' ? 'page' : undefined} onClick={() => navigateTo('contact')}>Contact</button>
            <button className="nav-cta" onClick={() => navigateTo('contact')}>Book a Demo</button>
          </div>
        </nav>
        <div className="breadcrumb" aria-live="polite"><span>{activePage === 'home' ? 'Home' : activePage === 'services' ? 'Our Expertise' : 'Contact Us'}</span></div>

        {/* Home Page */}
        {activePage === 'home' && (
          <section className="page-section active" aria-labelledby="home-heading">
            <AnimatedSection delay={0} isActive={activePage === 'home'}>
              <div className="hero">
                <div>
                  <span className="eyebrow"><i className="fas fa-map-pin" aria-hidden="true"></i> Nairobi, Kenya</span>
                  <h1 id="home-heading">We Turn Your Data Into Revenue, <span>Efficiency</span> and <span className="company-name">Growth.</span></h1>
                  <p>Helping businesses automate processes, build intelligent dashboards, and deploy practical AI solutions.</p>
                  <div className="hero-buttons">
                    <button className="btn-primary" onClick={() => navigateTo('services')}>Explore Our Expertise</button>
                    <button className="btn-outline" onClick={() => navigateTo('contact')}>Book a Demo</button>
                  </div>
                  <div className="trust-badge">
                    <span className="stars" aria-hidden="true"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></span>
                    Trusted by startups, NGOs and enterprises.
                  </div>
                </div>
                <div className="hero-visual">
                  <FloatingMetrics />
                  <HeroSlider />
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={100} isActive={activePage === 'home'}>
              <AnimatedNumbers isActive={activePage === 'home'} />
            </AnimatedSection>

            <div className="section-head">
              <span className="eyebrow"><i className="fas fa-layer-group" aria-hidden="true"></i> What we do</span>
              <h2 className="section-title">Our <span className="highlight">Expertise</span></h2>
              <p className="section-sub" style={{ margin: '0 auto' }}>End-to-end data and AI services from strategy to advanced intelligence.</p>
            </div>
            <div className="expertise-grid-home">
              {expertiseCards.map((card, i) => (
                <AnimatedSection key={i} delay={100 + i * 50} isActive={activePage === 'home'}>
                  <button className="expertise-card-home" onClick={() => navigateTo('services')}>
                    <div className="card-icon" style={{ background: card.bg }}><i className={`fas ${card.icon}`} aria-hidden="true"></i></div>
                    <h4>{card.title}</h4>
                    <p>{card.desc}</p>
                    <span className="learn-more">Learn more <i className="fas fa-arrow-right" aria-hidden="true"></i></span>
                  </button>
                </AnimatedSection>
              ))}
            </div>

            <div className="section-head" style={{ marginTop: '4rem' }}>
              <span className="eyebrow"><i className="fas fa-star" aria-hidden="true"></i> Why Azumi</span>
              <h2 className="section-title">Built by people who've done the <span className="highlight">fieldwork</span></h2>
              <p className="section-sub" style={{ margin: '0 auto' }}>We've sat through slow surveys and messy spreadsheets — that's why we build it better.</p>
            </div>
            <div className="why-grid">
              {[
                { icon: 'fa-users', title: 'Expert-Led Team', desc: 'Skilled professionals across analytics, engineering and strategy.' },
                { icon: 'fa-sliders-h', title: 'Customized Solutions', desc: 'Shaped around your business, not a one-size-fits-all package.' },
                { icon: 'fa-arrows-alt-h', title: 'Flexible Engagement', desc: 'Models that adapt to your scope and budget.' },
                { icon: 'fa-brain', title: 'AI & Innovation', desc: 'Practical AI woven into every solution.' },
                { icon: 'fa-lock', title: 'Ethical Practices', desc: 'Strict standards of data integrity and privacy.' },
                { icon: 'fa-map-marked-alt', title: 'Local Context, Global Standard', desc: 'Comfortable with paper surveys and cloud data lakes.' }
              ].map((item, i) => (
                <AnimatedSection key={i} delay={100 + i * 50} isActive={activePage === 'home'}>
                  <div className="why-item">
                    <div className="card-icon"><i className={`fas ${item.icon}`} aria-hidden="true"></i></div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection delay={100} isActive={activePage === 'home'}>
              <div className="cta-band">
                <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&h=500&fit=crop&auto=format&q=80" alt="" loading="lazy" />
                <div className="cta-band-content">
                  <h2>Ready to see your data differently with <span className="azumi">Azumi Analytics</span>?</h2>
                  <p>Book a free 30-minute session. No obligation, just a conversation about where your data could take you.</p>
                  <button className="btn-primary" onClick={() => navigateTo('contact')}>Book a Demo</button>
                </div>
              </div>
            </AnimatedSection>

            <div className="section-head">
              <span className="eyebrow"><i className="fas fa-toolbox" aria-hidden="true"></i> Our stack</span>
              <h2 className="section-title"> Our Tools of <span className="highlight">Trade</span></h2>
              <p className="section-sub" style={{ margin: '0 auto' }}>Industry-standard platforms, plus field-research tools.</p>
            </div>
            <div className="tools-grid">
              {toolsData.map((tool, i) => (
                <AnimatedSection key={i} delay={50 + i * 30} isActive={activePage === 'home'}>
                  <div className="tool-item">
                    {tool.custom ? (
                      <div className="custom-icon" style={{ background: tool.color }} aria-hidden="true">{tool.label}</div>
                    ) : (
                      <i className={`fas ${tool.icon} tool-icon`} style={{ color: tool.color }} aria-hidden="true"></i>
                    )}
                    <span className="tool-name">{tool.name}</span>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </section>
        )}

        {/* Services Page */}
        {activePage === 'services' && (
          <section className="page-section active" aria-labelledby="services-heading">
            <div className="section-head">
              <span className="eyebrow"><i className="fas fa-layer-group" aria-hidden="true"></i> Full breakdown</span>
              <h2 className="section-title" id="services-heading">Our <span className="highlight">Expertise</span>, In Detail</h2>
              <p className="expertise-intro" style={{ maxWidth: '760px', margin: '0 auto 2.5rem', color: 'var(--text-on-dark-soft)', fontSize: '1.05rem' }}>
                Azumi Analytics delivers end-to-end data and AI solutions from strategy and engineering to advanced analytics, machine learning, NLP and intelligent automation.
              </p>
            </div>
            <div className="expertise-grid-detailed">
              {servicesDetailed.map((service, i) => (
                <AnimatedSection key={i} delay={100 + i * 50} isActive={activePage === 'services'}>
                  <div className="expertise-card-detailed">
                    <img src={service.img} alt="" className="expertise-img" loading="lazy" />
                    <div className="card-header">
                      <div className="card-icon" style={{ background: service.bg }}><i className={`fas ${service.icon}`} aria-hidden="true"></i></div>
                      <h3>{service.title}</h3>
                    </div>
                    <ul>{service.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </section>
        )}

        {/* Contact Page */}
        {activePage === 'contact' && (
          <section className="page-section active" aria-labelledby="contact-heading">
            <div className="section-head">
              <span className="eyebrow"><i className="fas fa-comment-dots" aria-hidden="true"></i> Get in touch</span>
              <h2 className="section-title" id="contact-heading">Let's Talk About <span className="highlight">Your Data</span></h2>
              <p className="section-sub" style={{ margin: '0 auto' }}>Tell us what you're working on and we'll get back to you within 24 hours.</p>
            </div>
            <AnimatedSection delay={0} isActive={activePage === 'contact'}>
              <div className="contact-grid">
                <div className="contact-info">
                  <h3>Contact <span style={{ color: 'var(--accent)' }}>Azumi Analytics</span></h3>
                  <div className="info-item"><div className="card-icon"><i className="fas fa-phone-alt" aria-hidden="true"></i></div><div><strong>Call Us</strong><a href="tel:+254718704473">+254 718 704 473</a></div></div>
                  <div className="info-item"><div className="card-icon"><i className="fas fa-envelope" aria-hidden="true"></i></div><div><strong>Email Us</strong><a href="mailto:info@azumianalytics.co.ke">info@azumianalytics.co.ke</a></div></div>
                  <div className="info-item"><div className="card-icon"><i className="fas fa-map-marker-alt" aria-hidden="true"></i></div><div><strong>Visit Us</strong>Westlands, Nairobi, Kenya</div></div>
                </div>
                <SmartContactForm />
              </div>
            </AnimatedSection>
          </section>
        )}

        {/* Footer */}
        <footer className="footer">
          <FooterParticles />
          <div className="footer-inner">
            <div className="footer-grid">
              <div className="footer-brand">
                <img src="https://i.postimg.cc/T3pMK5bj/azumi-analytics.jpg" alt="Azumi Analytics logo" className="logo-img" />
                <span className="brand-name">Azumi<span>Analytics</span></span>
                <p>Empowering businesses with data intelligence, AI and automation built for Africa and beyond.</p>
              </div>
              <div className="footer-col">
                <h4>Quick Links</h4>
                <ul>
                  <li><button className="link-btn" onClick={() => navigateTo('home')}>Home</button></li>
                  <li><button className="link-btn" onClick={() => navigateTo('services')}>Our Expertise</button></li>
                  <li><button className="link-btn" onClick={() => navigateTo('contact')}>Contact Us</button></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Company</h4>
                <ul>
                  <li><button className="link-btn" onClick={() => navigateTo('contact')}>Careers</button></li>
                  <li><button className="link-btn" onClick={() => navigateTo('contact')}>Privacy Policy</button></li>
                  <li><button className="link-btn" onClick={() => navigateTo('contact')}>Terms of Service</button></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Contact</h4>
                <div className="footer-contact-item"><i className="fas fa-phone-alt" aria-hidden="true"></i><a href="tel:+254718704473">+254 718 704 473</a></div>
                <div className="footer-contact-item"><i className="fas fa-envelope" aria-hidden="true"></i><a href="mailto:info@azumianalytics.co.ke">info@azumianalytics.co.ke</a></div>
                <div className="footer-contact-item"><i className="fas fa-map-marker-alt" aria-hidden="true"></i><span>Westlands, Nairobi</span></div>
              </div>
            </div>
            <div className="footer-bottom">
              <p>&copy; 2026 <span className="azumi">Azumi Analytics</span>. All Rights Reserved.</p>
              <div className="footer-social">
                <a href="#" aria-label="Azumi Analytics on LinkedIn"><i className="fab fa-linkedin-in" aria-hidden="true"></i></a>
                <a href="#" aria-label="Azumi Analytics on Twitter / X"><i className="fab fa-twitter" aria-hidden="true"></i></a>
                <a href="#" aria-label="Azumi Analytics on GitHub"><i className="fab fa-github" aria-hidden="true"></i></a>
                <a href="#" aria-label="Azumi Analytics on YouTube"><i className="fab fa-youtube" aria-hidden="true"></i></a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
