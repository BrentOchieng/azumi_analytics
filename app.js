const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ====== CUSTOM HOOKS ======
function useCounter(target, suffix = '', duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(target / 60, 0.5);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.round(start));
      if (start >= target) clearInterval(timer);
    }, duration / 60);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count + suffix;
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

// ====== FOOTER PARTICLES ======
function FooterParticles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    let width = parent.offsetWidth;
    let height = parent.offsetHeight;
    canvas.width = width;
    canvas.height = height;

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
      requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      width = parent.offsetWidth;
      height = parent.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return <canvas ref={canvasRef} className="footer-particle-bg" />;
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
    const timer = setInterval(() => setCurrent(c => (c + 1) % slides.length), 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="hero-slider">
      {slides.map((slide, i) => (
        <div key={i} className={`hero-slide ${i === current ? 'active' : ''}`}>
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
          <button key={i} className={i === current ? 'active' : ''} onClick={() => setCurrent(i)} />
        ))}
      </div>
    </div>
  );
}

// ====== FLOATING METRICS ======
function FloatingMetrics() {
  return (
    <div className="floating-metrics">
      <div className="float-card"><i className="fas fa-folder-open"></i> <span>+60</span> Projects</div>
      <div className="float-card"><i className="fas fa-smile"></i> <span>98%</span> Client Satisfaction</div>
      <div className="float-card"><i className="fas fa-code"></i> <span>20+</span> Technologies</div>
      <div className="float-card"><i className="fas fa-brain"></i> <span>AI</span> Powered Solutions</div>
    </div>
  );
}

// ====== ANIMATED NUMBERS ======
function AnimatedNumbers({ isActive }) {
  return (
    <div className="numbers" id="numbersBand">
      <div className="number-item">
        <h3>{isActive ? useCounter(5) : '0'}</h3>
        <p>Years Team Experience</p>
      </div>
      <div className="number-item">
        <h3>{isActive ? useCounter(60) + '+' : '0'}</h3>
        <p>Projects Delivered</p>
      </div>
      <div className="number-item">
        <h3>{isActive ? useCounter(20) + '+' : '0'}</h3>
        <p>Tools in Our Stack</p>
      </div>
      <div className="number-item">
        <h3>{isActive ? useCounter(15) + '+' : '0'}</h3>
        <p>Client Engagements</p>
      </div>
    </div>
  );
}

// ====== AI CHAT ======
function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm Azumi AI Assistant. How can I help you with data analytics, AI, or automation?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        "We specialize in helping businesses turn data into revenue through analytics and AI.",
        "Our team can build custom dashboards that answer your specific business questions.",
        "We've helped 60+ clients automate processes and deploy practical AI solutions.",
        "Would you like to book a free consultation to discuss your project?",
        "We work with startups, NGOs, and enterprises across Africa and beyond."
      ];
      const aiMsg = { text: responses[Math.floor(Math.random() * responses.length)], sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span className="pulse-ring"></span>
        <i className="fas fa-comment-dots"></i>
        {!isOpen && <span className="notification-badge">1</span>}
      </button>
      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <h4>Azumi AI Assistant</h4>
            <p>Ask me about data, analytics, or automation</p>
          </div>
          <div className="chat-messages">
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
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question..."
              onKeyPress={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}><i className="fas fa-paper-plane"></i></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ====== SMART CONTACT FORM ======
function SmartContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [suggestions, setSuggestions] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const getSuggestions = (text) => {
    const keywords = {
      'dashboard': 'We specialize in creating interactive dashboards with real-time data...',
      'automation': 'Our RPA solutions can automate 70% of your repetitive tasks...',
      'AI': 'We can help you implement predictive models that learn from your data...',
      'analytics': 'Our analytics team can uncover insights you haven\'t discovered yet...',
      'data': 'We provide end-to-end data solutions from collection to visualization.',
      'machine': 'Our machine learning models are built for practical business outcomes.'
    };
    return Object.entries(keywords)
      .filter(([key]) => text.toLowerCase().includes(key))
      .map(([key, value]) => ({ trigger: key, suggestion: value }));
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, message: value }));
    if (value.length > 3) {
      setSuggestions(getSuggestions(value));
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="form-success show">
        <strong>✓ Message received.</strong> Thanks for reaching out — we'll get back to you within 24 hours.
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label htmlFor="name">Your Name</label>
      <input type="text" id="name" placeholder="Jane Wanjiru" required value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
      <label htmlFor="email">Email Address</label>
      <input type="email" id="email" placeholder="jane@example.com" required value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} />
      <label htmlFor="message">Message</label>
      <textarea id="message" rows="4" placeholder="Tell us about your project..." required value={formData.message} onChange={handleMessageChange} />
      {suggestions.length > 0 && (
        <div className="ai-suggestions">
          <h4>🤖 AI Suggestions</h4>
          {suggestions.map((s, i) => (
            <div key={i} className="suggestion" onClick={() => setFormData(prev => ({ ...prev, message: prev.message + '\n\n' + s.suggestion }))}>
              <span className="badge">{s.trigger}</span>
              <p>{s.suggestion}</p>
            </div>
          ))}
        </div>
      )}
      <button type="submit" className="btn-primary">Send Message <i className="fas fa-paper-plane" style={{ marginLeft: '8px' }}></i></button>
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
  const [activePage, setActivePage] = useState('home');

  const navigateTo = (page) => {
    setActivePage(page);
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
    { img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop&auto=format&q=80', icon: 'fa-clipboard-list', bg: '#2E9E8B', title: 'Data Collection', items: ['Survey design & instrumentation', 'Multi-source data integration', 'Real-time data ingestion', 'IoT & sensor data collection', 'Data validation & enrichment','Web Data Collection'] },
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

      <div className="container">
        {/* Navbar */}
        <nav className="navbar">
          <div className="logo-container">
            <img src="https://i.postimg.cc/T3pMK5bj/azumi-analytics.jpg" alt="Azumi Analytics" className="logo-img" />
            <div className="logo-text-wrapper">
              <div className="logo-text">Azumi<span>Analytics</span></div>
              <span className="small">Data &amp; AI Consultancy</span>
            </div>
          </div>
          <div className="nav-links">
            <a className={activePage === 'home' ? 'active' : ''} onClick={() => navigateTo('home')}>Home</a>
            <a className={activePage === 'services' ? 'active' : ''} onClick={() => navigateTo('services')}>Our Expertise</a>
            <a className={activePage === 'contact' ? 'active' : ''} onClick={() => navigateTo('contact')}>Contact</a>
            <a className="nav-cta" onClick={() => navigateTo('contact')}>Book a Demo</a>
          </div>
        </nav>
        <div className="breadcrumb"><span>{activePage === 'home' ? 'Home' : activePage === 'services' ? 'Our Expertise' : 'Contact Us'}</span></div>

        {/* Home Page */}
        {activePage === 'home' && (
          <section className="page-section active">
            <AnimatedSection delay={0} isActive={activePage === 'home'}>
              <div className="hero">
                <div>
                  <span className="eyebrow"><i className="fas fa-map-pin"></i> Nairobi, Kenya</span>
                  <h1>We Turn Your Data Into Revenue, <span>Efficiency</span> and <span className="company-name">Growth.</span></h1>
                  <p>Helping businesses automate processes, build intelligent dashboards, and deploy practical AI solutions.</p>
                  <div className="hero-buttons">
                    <button className="btn-primary" onClick={() => navigateTo('services')}>Explore Our Expertise</button>
                    <button className="btn-outline" onClick={() => navigateTo('contact')}>Book a Demo</button>
                  </div>
                  <div className="trust-badge">
                    <span className="stars"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></span>
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
              <span className="eyebrow"><i className="fas fa-layer-group"></i> What we do</span>
              <h2 className="section-title">Our <span className="highlight">Expertise</span></h2>
              <p className="section-sub" style={{ margin: '0 auto' }}>End-to-end data and AI services from strategy to advanced intelligence.</p>
            </div>
            <div className="expertise-grid-home">
              {expertiseCards.map((card, i) => (
                <AnimatedSection key={i} delay={100 + i * 50} isActive={activePage === 'home'}>
                  <div className="expertise-card-home" onClick={() => navigateTo('services')}>
                    <div className="card-icon" style={{ background: card.bg }}><i className={`fas ${card.icon}`}></i></div>
                    <h4>{card.title}</h4>
                    <p>{card.desc}</p>
                    <span className="learn-more">Learn more <i className="fas fa-arrow-right"></i></span>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <div className="section-head" style={{ marginTop: '4rem' }}>
              <span className="eyebrow"><i className="fas fa-star"></i> Why Azumi</span>
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
                    <div className="card-icon"><i className={`fas ${item.icon}`}></i></div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>

            <AnimatedSection delay={100} isActive={activePage === 'home'}>
              <div className="cta-band">
                <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&h=500&fit=crop&auto=format&q=80" alt="Team" loading="lazy" />
                <div className="cta-band-content">
                  <h2>Ready to see your data differently with <span className="azumi">Azumi Analytics</span>?</h2>
                  <p>Book a free 30-minute session. No obligation, just a conversation about where your data could take you.</p>
                  <button className="btn-primary" onClick={() => navigateTo('contact')}>Book a Demo</button>
                </div>
              </div>
            </AnimatedSection>

            <div className="section-head">
              <span className="eyebrow"><i className="fas fa-toolbox"></i> Our stack</span>
              <h2 className="section-title"> Our Tools of <span className="highlight">Trade</span></h2>
              <p className="section-sub" style={{ margin: '0 auto' }}>Industry-standard platforms, plus field-research tools.</p>
            </div>
            <div className="tools-grid">
              {toolsData.map((tool, i) => (
                <AnimatedSection key={i} delay={50 + i * 30} isActive={activePage === 'home'}>
                  <div className="tool-item">
                    {tool.custom ? (
                      <div className="custom-icon" style={{ background: tool.color }}>{tool.label}</div>
                    ) : (
                      <i className={`fas ${tool.icon} tool-icon`} style={{ color: tool.color }}></i>
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
          <section className="page-section active">
            <div className="section-head">
              <span className="eyebrow"><i className="fas fa-layer-group"></i> Full breakdown</span>
              <h2 className="section-title">Our <span className="highlight">Expertise</span>, In Detail</h2>
              <p className="expertise-intro" style={{ maxWidth: '760px', margin: '0 auto 2.5rem', color: 'var(--text-soft)', fontSize: '1.05rem' }}>
                Azumi Analytics delivers end-to-end data and AI solutions from strategy and engineering to advanced analytics, machine learning, NLP and intelligent automation.
              </p>
            </div>
            <div className="expertise-grid-detailed">
              {servicesDetailed.map((service, i) => (
                <AnimatedSection key={i} delay={100 + i * 50} isActive={activePage === 'services'}>
                  <div className="expertise-card-detailed">
                    <img src={service.img} alt={service.title} className="expertise-img" loading="lazy" />
                    <div className="card-header">
                      <div className="card-icon" style={{ background: service.bg }}><i className={`fas ${service.icon}`}></i></div>
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
          <section className="page-section active">
            <div className="section-head">
              <span className="eyebrow"><i className="fas fa-comment-dots"></i> Get in touch</span>
              <h2 className="section-title">Let's Talk About <span className="highlight">Your Data</span></h2>
              <p className="section-sub" style={{ margin: '0 auto' }}>Tell us what you're working on and we'll get back to you within 24 hours.</p>
            </div>
            <AnimatedSection delay={0} isActive={activePage === 'contact'}>
              <div className="contact-grid">
                <div className="contact-info">
                  <h3>Contact <span style={{ color: 'var(--accent)' }}>Azumi Analytics</span></h3>
                  <div className="info-item"><div className="card-icon"><i className="fas fa-phone-alt"></i></div><div><strong>Call Us</strong>+254 718704473</div></div>
                  <div className="info-item"><div className="card-icon"><i className="fas fa-envelope"></i></div><div><strong>Email Us</strong>info@azumianalytics.co.ke</div></div>
                  <div className="info-item"><div className="card-icon"><i className="fas fa-map-marker-alt"></i></div><div><strong>Visit Us</strong>Westlands, Nairobi, Kenya</div></div>
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
                <img src="https://i.postimg.cc/T3pMK5bj/azumi-analytics.jpg" alt="Azumi Analytics" className="logo-img" />
                <span className="brand-name">Azumi<span>Analytics</span></span>
                <p>Empowering businesses with data intelligence, AI and automation built for Africa and beyond.</p>
              </div>
              <div className="footer-col"><h4>Quick Links</h4><ul><li><a onClick={() => navigateTo('home')}>Home</a></li><li><a onClick={() => navigateTo('services')}>Our Expertise</a></li><li><a onClick={() => navigateTo('contact')}>Contact Us</a></li></ul></div>
              <div className="footer-col"><h4>Company</h4><ul><li><a>Careers</a></li><li><a>Privacy Policy</a></li><li><a>Terms of Service</a></li></ul></div>
              <div className="footer-col"><h4>Contact</h4><div className="footer-contact-item"><i className="fas fa-phone-alt"></i><span>+254 718704473</span></div><div className="footer-contact-item"><i className="fas fa-envelope"></i><span>info@azumianalytics.co.ke</span></div><div className="footer-contact-item"><i className="fas fa-map-marker-alt"></i><span>Westlands, Nairobi</span></div></div>
            </div>
            <div className="footer-bottom">
              <p>&copy; 2026 <span className="azumi">Azumi Analytics</span>. All Rights Reserved.</p>
              <div className="footer-social"><a><i className="fab fa-linkedin-in"></i></a><a><i className="fab fa-twitter"></i></a><a><i className="fab fa-github"></i></a><a><i className="fab fa-youtube"></i></a></div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);