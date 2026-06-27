import { useState } from 'react';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import Stepper, { Step } from './Stepper.jsx';

const Onboarding = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Arrow pointing direction and target description per step
  const stepArrows = {
    1: null, // Welcome - no arrow
    2: { direction: 'up', position: 'top-center', text: 'Menu button in the navbar' },
    3: { direction: 'down', position: 'bottom-right', text: 'The + button on food items' },
    4: { direction: 'up', position: 'top-right', text: 'Cart icon in the navbar' },
    5: { direction: 'up', position: 'top-center', text: 'Orders in the navbar' },
    6: null, // Done - no arrow
  };

  const arrow = stepArrows[currentStep];

  return (
    <div className="onboarding-overlay">
      {/* Skip button */}
      <button
        onClick={onComplete}
        className="fixed top-4 right-4 z-[1001] bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-all flex items-center gap-1.5"
      >
        <X size={14} /> Skip
      </button>

      {/* Arrow indicator */}
      {arrow && (
        <div className={`onboarding-arrow onboarding-arrow--${arrow.position}`}>
          {arrow.direction === 'up' ? (
            <ArrowUp size={28} className="text-white animate-bounce" />
          ) : (
            <ArrowDown size={28} className="text-white animate-bounce" />
          )}
          <span className="onboarding-arrow-text">{arrow.text}</span>
        </div>
      )}

      {/* Stepper */}
      <Stepper
        initialStep={1}
        nextButtonText="Next"
        backButtonText="Back"
        onStepChange={(step) => setCurrentStep(step)}
        onFinalStepCompleted={onComplete}
      >
        <Step>
          <h2>Welcome to Akio</h2>
          <p>A quick walkthrough to help you start ordering food. This will only take a moment.</p>
        </Step>
        <Step>
          <h2>Browse the Menu</h2>
          <p>Tap <strong>Menu</strong> in the navigation bar above to explore food categories and search for dishes.</p>
        </Step>
        <Step>
          <h2>Add Items to Cart</h2>
          <p>Found something you like? Tap the <strong>+</strong> button on any item. Use <strong>-</strong> and <strong>+</strong> to adjust the quantity.</p>
        </Step>
        <Step>
          <h2>Place Your Order</h2>
          <p>Go to your <strong>Cart</strong>, review items and total, then tap <strong>Place Order</strong> to pay securely.</p>
        </Step>
        <Step>
          <h2>Track Orders</h2>
          <p>Visit <strong>Orders</strong> to see real-time status updates. You can cancel pending orders if needed.</p>
        </Step>
        <Step>
          <h2>You're ready</h2>
          <p>That's everything. Enjoy your meal and happy ordering!</p>
        </Step>
      </Stepper>
    </div>
  );
};

export default Onboarding;
