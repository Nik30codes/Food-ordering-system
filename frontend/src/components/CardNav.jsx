import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, UtensilsCrossed, ClipboardList, User, Phone, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import './CardNav.css';

const CardNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  const navItems = [
    { label: 'Menu', desc: 'Browse our dishes', icon: UtensilsCrossed, path: '/menu' },
    { label: 'Cart', desc: `${itemCount} items`, icon: ShoppingCart, path: '/cart' },
    { label: 'Orders', desc: 'Track your orders', icon: ClipboardList, path: '/orders' },
    { label: 'Profile', desc: 'Your account', icon: User, path: '/profile' },
    { label: 'Contact', desc: 'Get in touch', icon: Phone, path: '/contact' },
  ];

  const calculateHeight = () => {
    const topBar = 60;
    const cardHeight = 64;
    const gap = 8;
    const padding = 16;
    const itemsCount = user ? navItems.length + 1 : navItems.length + 1; // +1 for login/logout
    return topBar + (cardHeight * itemsCount) + (gap * (itemsCount - 1)) + padding;
  };

  useLayoutEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current.filter(Boolean), { y: 40, opacity: 0, scale: 0.85 });

    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.35, ease: 'power3.out' });
    tl.to(cardsRef.current.filter(Boolean), { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.4)', stagger: 0.06 }, '-=0.15');

    tlRef.current = tl;
    return () => { tl.kill(); };
  }, [user, itemCount]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;

    if (!isExpanded) {
      setIsOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const handleNavClick = (path) => {
    toggleMenu();
    setTimeout(() => navigate(path), 300);
  };

  const handleLogout = () => {
    toggleMenu();
    setTimeout(async () => {
      await logout();
      navigate('/');
    }, 300);
  };

  const setCardRef = (i) => (el) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className="card-nav-container md:hidden">
      <nav ref={navRef} className={`card-nav ${isExpanded ? 'open' : ''}`}>
        {/* Top bar */}
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            aria-expanded={isExpanded}
            tabIndex={0}
            style={{ color: 'white' }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container">
            <span className="card-nav-logo-text">
              Aki<span className="card-nav-logo-accent">o</span>
            </span>
          </div>

          <button className="card-nav-cart-btn" onClick={() => navigate('/cart')} aria-label="Cart">
            <ShoppingCart size={22} />
            {itemCount > 0 && <span className="card-nav-cart-badge">{itemCount}</span>}
          </button>
        </div>

        {/* Expandable content */}
        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {navItems.map((item, idx) => (
            <div
              key={item.label}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: 'rgba(45, 92, 79, 0.5)' }}
              onClick={() => handleNavClick(item.path)}
            >
              <div className="nav-card-icon" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <item.icon size={18} color="white" />
              </div>
              <div className="nav-card-info">
                <div className="nav-card-label">{item.label}</div>
                <div className="nav-card-desc">{item.desc}</div>
              </div>
              <ChevronRight size={18} className="nav-card-arrow" />
            </div>
          ))}

          {/* Login/Logout card */}
          {user ? (
            <div
              className="nav-card"
              ref={setCardRef(navItems.length)}
              style={{ backgroundColor: '#dc2626' }}
              onClick={handleLogout}
            >
              <div className="nav-card-icon" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <LogOut size={18} color="white" />
              </div>
              <div className="nav-card-info">
                <div className="nav-card-label">Logout</div>
                <div className="nav-card-desc">{user.name}</div>
              </div>
              <ChevronRight size={18} className="nav-card-arrow" />
            </div>
          ) : (
            <div
              className="nav-card"
              ref={setCardRef(navItems.length)}
              style={{ backgroundColor: 'rgba(45, 92, 79, 0.5)' }}
              onClick={() => handleNavClick('/login')}
            >
              <div className="nav-card-icon" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <User size={18} color="white" />
              </div>
              <div className="nav-card-info">
                <div className="nav-card-label">Login</div>
                <div className="nav-card-desc">Sign in to your account</div>
              </div>
              <ChevronRight size={18} className="nav-card-arrow" />
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
