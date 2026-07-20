const { useState, useEffect, useRef, useMemo } = React;

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
function useCounter(target, active, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = Math.max(target / 50, 0.5);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(Math.round(start));
      if (start >= target) clearInterval(timer);
    }, duration / 50);
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

// ====== ANIMATED SECTION WRAPPER ======
function AnimatedSection({ children, className = '', delay = 0, isActive = true }) {
  const ref = useRef(null);
  const isVisible = useInView(ref);

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

// ====== HERO PHOTO MOSAIC ======
// All nine expertise photos hover quietly in the background of the hero,
// each settling in on load and brightening slightly on hover — the
// headline and copy sit on top over a dark scrim. One container, not
// a separate strip below the hero.
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=500&h=500&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=500&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&h=500&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&h=500&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=500&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=500&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&h=500&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=500&h=500&fit=crop&auto=format&q=80'
];

function HeroPhotoMosaic() {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div className="hero-photo-grid" aria-hidden="true">
      {HERO_IMAGES.map((src, i) => (
        <div
          key={i}
          className="hero-photo-cell"
          style={reducedMotion ? {} : { animationDelay: `${i * 90}ms` }}
        >
          <div
            className="hero-photo-float"
            style={reducedMotion ? {} : {
              animationDuration: `${6.5 + (i % 4) * 1.1}s`,
              animationDelay: `${-(i * 0.6)}s`
            }}
          >
            <img src={src} alt="" loading="lazy" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ====== AI CHAT ======
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
        "We turn scattered data — spreadsheets, field surveys, system logs — into dashboards your team actually opens.",
        "Our engineers build the pipeline; our analysts build the dashboard. You get both, not just a report.",
        "We've delivered 60+ engagements, from two-week diagnostics to year-long data platform builds.",
        "Want to talk specifics? Use the contact form — a consultant replies within 24 hours, not a bot.",
        "We work across East Africa with startups, NGOs doing field research, and enterprises modernising legacy systems."
      ];
      const aiMsg = { text: responses[Math.floor(Math.random() * responses.length)], sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1100);
  };

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
      <button
        className="chat-toggle"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close chat assistant' : 'Open chat assistant'}
      >
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
            <label htmlFor="chatInput" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
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
// IMPORTANT — replace this with your own Formspree endpoint before going live:
// 1. Create a free account at https://formspree.io
// 2. Create a new form, point it at brentwash35@gmail.com (or wherever
//    you want submissions delivered)
// 3. Copy the endpoint it gives you (looks like https://formspree.io/f/xxxxabcd)
//    and paste it below, replacing the placeholder.
const FORM_ENDPOINT = 'https://formspree.io/f/mojgdyol';

function SmartContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | failed
  const [error, setError] = useState('');

  const topicHints = {
    dashboard: 'We build interactive dashboards on your live data, not static slide decks.',
    automation: 'Our automation work removes the manual steps between raw data and a decision.',
    ai: 'We train predictive models on your own historical data, not generic templates.',
    analytics: 'Our analysts look for the question behind the question before touching a chart.',
    data: 'We handle the full chain — collection, cleaning, storage, and visualization.',
    machine: 'Our ML models are scoped around one business outcome, not a general capability.'
  };

  const matchedHints = useMemo(() => {
    const text = formData.message.toLowerCase();
    return Object.entries(topicHints).filter(([key]) => text.includes(key));
  }, [formData.message]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
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

    setStatus('sending');
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus('sent');
      } else {
        setStatus('failed');
        setError('Something went wrong sending your message. Please try again or email us directly.');
      }
    } catch (err) {
      setStatus('failed');
      setError('Could not reach the server. Please check your connection and try again, or email us directly.');
    }
  };

  if (status === 'sent') {
    return (
      <div className="form-success show" role="status">
        <strong>Thanks — your message has been sent.</strong>
        <p>A consultant will get back to you within 24 hours. In the meantime you can also reach us at <a href="mailto:brentwash35@gmail.com">brentwash35@gmail.com</a>.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {error && <div className="form-error-banner" role="alert">{error}</div>}

      <label htmlFor="name">Your name <span className="required">*</span></label>
      <input
        type="text" id="name" name="name" placeholder="Jane Wanjiru" required
        value={formData.name}
        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
      />

      <label htmlFor="email">Email address <span className="required">*</span></label>
      <input
        type="email" id="email" name="email" placeholder="jane@example.com" required
        value={formData.email}
        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
      />

      <label htmlFor="message">Tell us about the project <span className="required">*</span></label>
      <textarea
        id="message" name="message" rows="4" placeholder="What data problem are you trying to solve?" required
        value={formData.message}
        onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
      />

      {matchedHints.length > 0 && (
        <div className="ai-suggestions">
          <h4>Related to what you're describing</h4>
          <ul>
            {matchedHints.map(([key, text]) => (
              <li key={key}>
                <span className="tagchip">{key}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send message'} <i className="fas fa-arrow-right" aria-hidden="true"></i>
      </button>
    </form>
  );
}

// ====== TOOLS DATA ======
const toolsData = [
  { name: 'MS SQL', icon: 'fa-database', color: '#3fa294' },
  { name: 'MySQL', icon: 'fa-database', color: '#3fa294' },
  { name: 'PostgreSQL', icon: 'fa-database', color: '#3fa294' },
  { name: 'Python', icon: 'fa-python', color: '#d69a3f' },
  { name: 'Power BI', icon: 'fa-chart-bar', color: '#d69a3f' },
  { name: 'Tableau', icon: 'fa-chart-pie', color: '#d69a3f' },
  { name: 'Excel', icon: 'fa-file-excel', color: '#3fa294' },
  { name: 'AWS', icon: 'fa-aws', color: '#9aa4b8' },
  { name: 'Azure', icon: 'fa-microsoft', color: '#9aa4b8' },
  { name: 'GCP', icon: 'fa-cloud', color: '#9aa4b8' },
  { name: 'Docker', icon: 'fa-docker', color: '#9aa4b8' },
  { name: 'Spark', icon: 'fa-bolt', color: '#d69a3f' },
  { name: 'Airflow', icon: 'fa-wind', color: '#3fa294' },
  { name: 'Looker', icon: 'fa-eye', color: '#9aa4b8' },
  { name: 'Jupyter', icon: 'fa-book', color: '#d69a3f' },
  { name: 'KoboToolbox', icon: '', color: '#3fa294', custom: true, label: 'K' },
  { name: 'Fabric', icon: '', color: '#9aa4b8', custom: true, label: 'F' },
  { name: 'SurveyCTO', icon: '', color: '#b47c2b', custom: true, label: 'S' },
  { name: 'DuckDB', icon: 'fa-database', color: '#d69a3f' },
  { name: 'R', icon: 'fa-r-project', color: '#3fa294' },
  { name: 'dbt', icon: 'fa-database', color: '#9aa4b8' }
];

// ====== MAIN APP ======
function App() {
  const [activePage, setActivePage] = useState(pageFromHash());

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

  const serviceCards = [
    { tag: 'AV', title: 'Analytics & visualization', desc: 'Dashboards and reports your team opens on its own — because the numbers on them answer a real question.' },
    { tag: 'DS', title: 'Data strategy advisory', desc: 'A roadmap that names what to fix first, not a slide deck of best practices.' },
    { tag: 'DE', title: 'Data engineering', desc: 'Pipelines and warehouses sized for the data you have today and the volume you\'ll hit next year.' },
    { tag: 'ML', title: 'AI & machine learning', desc: 'Predictive models scoped to one business outcome, tested against your own historical data.' },
    { tag: 'DC', title: 'Data collection', desc: 'Field-ready survey design built for patchy connectivity and real enumerators, not lab conditions.' },
    { tag: 'QM', title: 'Data quality management', desc: 'The unglamorous cleanup work that makes every dashboard after it trustworthy.' },
    { tag: 'TR', title: 'Training & enablement', desc: 'Programs that leave your team able to run the tools themselves after we leave.' },
    { tag: 'RPA', title: 'Intelligent automation', desc: 'Automating the repetitive handoffs between systems so people can work on judgment calls.' },
    { tag: 'NLP', title: 'Natural language processing', desc: 'Turning free-text feedback, transcripts, and survey responses into something you can chart.' }
  ];

  const servicesDetailed = [
    { img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&auto=format&q=80', tag: 'AV', title: 'Analytics & visualization', items: ['BI strategy & roadmapping', 'KPI design & performance tracking', 'Predictive & diagnostic analytics', 'Interactive dashboards & reporting', 'Data storytelling & executive reporting'] },
    { img: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=400&fit=crop&auto=format&q=80', tag: 'DS', title: 'Data strategy advisory', items: ['Data strategy & roadmapping', 'Digital modernisation planning', 'Readiness & maturity assessment', 'Reference architecture & blueprints', 'Business analysis & value mapping'] },
    { img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop&auto=format&q=80', tag: 'DE', title: 'Data engineering', items: ['Data architecture & modeling', 'Warehouse & lake design', 'ETL / ELT pipeline development', 'Cloud infrastructure (AWS, Azure, GCP)', 'Real-time & batch processing'] },
    { img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop&auto=format&q=80', tag: 'ML', title: 'AI & machine learning', items: ['Predictive modeling & forecasting', 'Computer vision & image analysis', 'Anomaly & fraud detection', 'Recommendation engines', 'Automated machine learning (AutoML)'] },
    { img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop&auto=format&q=80', tag: 'DC', title: 'Data collection', items: ['Survey design & instrumentation', 'Multi-source data integration', 'Real-time data ingestion', 'IoT & sensor data collection', 'Data validation & enrichment'] },
    { img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&auto=format&q=80', tag: 'QM', title: 'Data quality management', items: ['Data profiling & auditing', 'Cleansing & standardization', 'Master data management (MDM)', 'Validation automation', 'Quality monitoring dashboards'] },
    { img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop&auto=format&q=80', tag: 'TR', title: 'Training & enablement', items: ['Data literacy programs', 'Analytics tools training', 'Custom workshops & enablement', 'Executive data strategy coaching', 'Building a data-driven culture'] },
    { img: 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=600&h=400&fit=crop&auto=format&q=80', tag: 'RPA', title: 'Intelligent automation', items: ['Robotic process automation (RPA)', 'Workflow & business process automation', 'Process mining & optimization', 'AI operations (AIOps)', 'Smart document & content processing'] },
    { img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&auto=format&q=80', tag: 'NLP', title: 'Natural language processing', items: ['Text classification & categorization', 'Sentiment & emotion analysis', 'Named entity recognition (NER)', 'Chatbots & conversational AI', 'Language translation & summarization'] }
  ];

  const whyItems = [
    { idx: 'TEAM', title: 'Expert-led team', desc: 'Analysts, engineers and strategists who\'ve shipped the work before, not just studied it.' },
    { idx: 'FIT', title: 'Built around you', desc: 'Solutions shaped to your systems and budget, not a packaged template.' },
    { idx: 'SCOPE', title: 'Flexible engagement', desc: 'From a two-week diagnostic to an embedded team — sized to the problem.' },
    { idx: 'AI', title: 'Practical AI', desc: 'Models scoped to a decision you need to make, not AI for its own sake.' },
    { idx: 'ETHICS', title: 'Ethical practice', desc: 'Clear standards on data integrity, consent, and privacy on every engagement.' }
  ];

  return (
    <>
      <AIChat />

      <div className="main-content-wrapper">
        <div className="container" id="main-content">
          {/* Navbar */}
          <nav className="navbar" aria-label="Primary">
            <a href="#/home" className="logo-container" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>
              <img src="https://i.postimg.cc/KzDPy8QC/azumilogo.png" alt="Azumi Analytics logo" className="logo-img" />
              <div className="logo-text">
                Azumi<span>Analytics</span>
                <span className="small">Data &amp; AI Consultancy</span>
              </div>
            </a>
            <div className="nav-links">
              <button className="nav-link" aria-current={activePage === 'home' ? 'page' : undefined} onClick={() => navigateTo('home')}>Home</button>
              <button className="nav-link" aria-current={activePage === 'services' ? 'page' : undefined} onClick={() => navigateTo('services')}>Our Expertise</button>
              <button className="nav-link" aria-current={activePage === 'contact' ? 'page' : undefined} onClick={() => navigateTo('contact')}>Contact</button>
              <button className="nav-cta" onClick={() => navigateTo('contact')}>Book a demo</button>
            </div>
          </nav>

          <div className="breadcrumb" aria-live="polite">
            <span>{activePage === 'home' ? 'Home' : activePage === 'services' ? 'Our Expertise' : 'Contact Us'}</span>
          </div>

          {/* Home Page */}
          {activePage === 'home' && (
            <section className="page-section active" aria-labelledby="home-heading">
              <div className="hero-wrapper">
                <HeroPhotoMosaic />
                <div className="hero-scrim"></div>
                <div className="hero-grid">
                  <div className="hero-content">
                    <span className="tag"><i className="fas fa-map-pin" aria-hidden="true"></i> Nairobi, Kenya</span>
                    <h1 id="home-heading">We turn Your data into <span className="highlight">Revenue, Efficiency and Growth</span></h1>
                    <p>Helping businesses automate processes, build intelligent systems, and deploy practical AI solutions.</p>
                    <div className="hero-buttons">
                      <button className="btn-primary" onClick={() => navigateTo('services')}>Explore our expertise</button>
                      <button className="btn-outline" onClick={() => navigateTo('contact')}>Book a demo</button>
                    </div>
                    <div className="trust-badge">
                      <span className="stars" aria-hidden="true"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></span>
                      Trusted by startups, NGOs and enterprises
                    </div>
                  </div>
                </div>
              </div>

              <AnimatedSection delay={100} isActive={activePage === 'home'}>
                <HomeNumbers isActive={activePage === 'home'} />
              </AnimatedSection>

              <div className="home-panel-dark">
                <div className="section-head centered">
                  <span className="eyebrow">What we do</span>
                  <h2 className="section-title">Our <span className="highlight">expertise</span></h2>
                  <p className="section-sub" style={{ margin: '0 auto' }}>End-to-end data and AI work, from a first diagnostic to a production model.</p>
                </div>
                <div className="services-grid">
                  {serviceCards.map((card, i) => (
                    <AnimatedSection key={i} delay={60 + i * 40} isActive={activePage === 'home'}>
                      <button className="service-card" onClick={() => navigateTo('services')}>
                        <div className="service-card-top">
                          <span className="card-tag">{card.tag}</span>
                          <h4>{card.title}</h4>
                          <p>{card.desc}</p>
                        </div>
                        <span className="learn-more">Learn more <i className="fas fa-arrow-right" aria-hidden="true"></i></span>
                      </button>
                    </AnimatedSection>
                  ))}
                </div>
              </div>

              <div className="home-panel-dark">
                <div className="section-head centered">
                  <span className="eyebrow">Why Azumi</span>
                  <h2 className="section-title">Built by people who've done the <span className="highlight">fieldwork</span></h2>
                  <p className="section-sub" style={{ margin: '0 auto' }}>We've sat through slow surveys and messy spreadsheets ourselves, that's why we build it differently.</p>
                </div>
                <div className="why-grid">
                  {whyItems.map((item, i) => (
                    <AnimatedSection key={i} delay={60 + i * 40} isActive={activePage === 'home'}>
                      <div className="why-item">
                        <span className="idx">{item.idx}</span>
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              </div>

              <AnimatedSection delay={100} isActive={activePage === 'home'}>
                <div className="cta-band">
                  <h2>Ready to see your data differently with <span className="azumi">Azumi Analytics</span>?</h2>
                  <p>Book a free 30-minute session — no obligation, just a conversation about where your data could take you.</p>
                  <button className="btn-primary" onClick={() => navigateTo('contact')}>Book a demo</button>
                </div>
              </AnimatedSection>

              <div className="home-panel-dark">
                <div className="section-head centered">
                  <span className="eyebrow">Our stack</span>
                  <h2 className="section-title">Our tools of <span className="highlight">trade</span></h2>
                  <p className="section-sub" style={{ margin: '0 auto' }}>Industry-standard platforms, plus the field-research tools.</p>
                </div>
                <div className="tools-grid">
                  {toolsData.map((tool, i) => (
                    <AnimatedSection key={i} delay={30 + i * 20} isActive={activePage === 'home'}>
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
              </div>
            </section>
          )}

          {/* Services Page */}
          {activePage === 'services' && (
            <section className="page-section active" aria-labelledby="services-heading">
              <div className="section-head centered">
                <span className="eyebrow">Full breakdown</span>
                <h2 className="section-title" id="services-heading">Our <span className="highlight">expertise</span>, in detail</h2>
                <p className="expertise-intro" style={{ maxWidth: '720px', margin: '0 auto 2.5rem', color: 'var(--text-muted)', fontSize: '1.02rem' }}>
                  Azumi Analytics delivers end-to-end data and AI solutions from strategy and engineering to advanced analytics, machine learning, NLP,and intelligent automation.
                </p>
              </div>
              <div className="expertise-grid-detailed">
                {servicesDetailed.map((service, i) => (
                  <AnimatedSection key={i} delay={60 + i * 40} isActive={activePage === 'services'}>
                    <div className="expertise-card-detailed">
                      <img src={service.img} alt="" className="expertise-img" loading="lazy" />
                      <div className="expertise-card-body">
                        <div className="card-header">
                          <span className="card-tag">{service.tag}</span>
                          <h3>{service.title}</h3>
                        </div>
                        <ul>{service.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </section>
          )}

          {/* Contact Page */}
          {activePage === 'contact' && (
            <section className="page-section active" aria-labelledby="contact-heading">
              <div className="section-head centered">
                <span className="eyebrow">Get in touch</span>
                <h2 className="section-title" id="contact-heading">Let's talk about <span className="highlight">your data</span></h2>
                <p className="section-sub" style={{ margin: '0 auto' }}>Tell us what you're working on and we'll get back to you within 24 hours.</p>
              </div>
              <AnimatedSection delay={0} isActive={activePage === 'contact'}>
                <div className="contact-grid">
                  <div className="contact-info">
                    <h3>Contact Azumi Analytics</h3>
                    <div className="info-item"><div className="card-icon"><i className="fas fa-phone-alt" aria-hidden="true"></i></div><div><strong>Call us</strong><a href="tel:+254718704473">+254 718 704 473</a></div></div>
                    <div className="info-item"><div className="card-icon"><i className="fas fa-envelope" aria-hidden="true"></i></div><div><strong>Email us</strong><a href="mailto:brentwash35@gmail.com">brentwash35@gmail.com</a></div></div>
                    <div className="info-item"><div className="card-icon"><i className="fas fa-map-marker-alt" aria-hidden="true"></i></div><div><strong>Visit us</strong><span className="plain">Westlands, Nairobi, Kenya</span></div></div>
                  </div>
                  <SmartContactForm />
                </div>
              </AnimatedSection>
            </section>
          )}

          {/* Footer */}
          <footer className="footer">
            <div className="footer-inner">
              <div className="footer-grid">
                <div className="footer-brand">
                  <span className="footer-text-logo">Azumi<span>Analytics</span></span>
                  <span className="footer-tagline">Data &amp; AI Consultancy</span>
                  <p>Empowering businesses with data intelligence, AI and automation built for Africa and beyond.</p>
                </div>
                <div className="footer-col">
                  <h4>Quick links</h4>
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
                  <div className="footer-contact-item"><i className="fas fa-envelope" aria-hidden="true"></i><a href="mailto:brentwash35@gmail.com">brentwash35@gmail.com</a></div>
                  <div className="footer-contact-item"><i className="fas fa-map-marker-alt" aria-hidden="true"></i><span>Westlands, Nairobi</span></div>
                </div>
              </div>
              <div className="footer-bottom">
                <p>&copy; 2026 <span className="azumi">Azumi Analytics</span>. All rights reserved.</p>
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
      </div>
    </>
  );
}

// ====== DATA READOUT STRIP ======
// Counts up only once the strip is actually scrolled into view, so on
// mobile (where the hero fills the screen) the animation still plays
// when the user reaches it, instead of having already finished off-screen.
function HomeNumbers({ isActive }) {
  const ref = useRef(null);
  const isVisible = useInView(ref);
  const shouldCount = isActive && isVisible;

  const years = useCounter(5, shouldCount);
  const projects = useCounter(60, shouldCount);
  const tools = useCounter(20, shouldCount);
  const engagements = useCounter(15, shouldCount);

  return (
    <div className="numbers-wrapper" ref={ref}>
      <div className="numbers">
        <div className="number-item"><h3>{years}<span className="plus">+</span></h3><p>Years team experience</p></div>
        <div className="number-item"><h3>{projects}<span className="plus">+</span></h3><p>Projects delivered</p></div>
        <div className="number-item"><h3>{tools}<span className="plus">+</span></h3><p>Tools in our stack</p></div>
        <div className="number-item"><h3>{engagements}<span className="plus">+</span></h3><p>Client engagements</p></div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
