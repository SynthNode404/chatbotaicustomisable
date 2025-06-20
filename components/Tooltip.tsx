import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  text: string;
  children: React.ReactElement<React.HTMLProps<HTMLElement>>; // Changed: More specific type for children
  delay?: number; // milliseconds
  position?: 'top' | 'bottom' | 'left' | 'right'; // Basic positioning hint
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, delay = 300, position: preferredPosition = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  
  // React.useId is available in React 18+
  const reactId = typeof React.useId === 'function' ? React.useId() : Math.random().toString(36).substring(2,9);
  const tooltipId = `tooltip-${reactId}`;

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipNode = tooltipRef.current;
    
    // Ensure the tooltip is measurable
    const originalOpacity = tooltipNode.style.opacity;
    const originalDisplay = tooltipNode.style.display;
    tooltipNode.style.opacity = '0';
    tooltipNode.style.display = 'block';
    tooltipNode.style.visibility = 'hidden'; // Use visibility for measurement without affecting layout too much

    const tooltipRect = tooltipNode.getBoundingClientRect();

    tooltipNode.style.opacity = originalOpacity;
    tooltipNode.style.display = originalDisplay;
    tooltipNode.style.visibility = 'visible';


    let top = 0;
    let left = 0;
    const spacing = 8; // 8px spacing from trigger

    switch (preferredPosition) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        if (top < 0 && (triggerRect.bottom + tooltipRect.height + spacing < window.innerHeight)) { // Not enough space on top, try bottom
          top = triggerRect.bottom + spacing;
        }
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        if (top + tooltipRect.height > window.innerHeight && (triggerRect.top - tooltipRect.height - spacing > 0)) { // Not enough space on bottom, try top
          top = triggerRect.top - tooltipRect.height - spacing;
        }
        break;
      default: // Default to top
        top = triggerRect.top - tooltipRect.height - spacing;
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        if (top < 0 && (triggerRect.bottom + tooltipRect.height + spacing < window.innerHeight)) {
          top = triggerRect.bottom + spacing;
        }
    }

    // Horizontal adjustments to keep it in viewport
    if (left < 0) {
      left = spacing;
    } else if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - spacing;
    }
    
    // Final vertical adjustments if still out of bounds
    if (top < 0) {
      top = spacing;
    } else if (top + tooltipRect.height > window.innerHeight) {
      top = window.innerHeight - tooltipRect.height - spacing;
    }

    setPos({ top: top + window.scrollY, left: left + window.scrollX });
  }, [preferredPosition]);

  const showTooltip = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay]);

  const hideTooltip = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  }, []);
  
  useEffect(() => {
    if (isVisible) {
      // Calculate position after a tick to ensure tooltipRef is rendered and measured correctly
      // requestAnimationFrame helps ensure the element is in the DOM and has dimensions
      requestAnimationFrame(() => { // Changed: Corrected arrow function syntax
        if(tooltipRef.current){ // check if still mounted
             calculatePosition();
        }
      });
    }
  }, [isVisible, text, calculatePosition]); // Re-calculate if text changes (affecting size) or visibility changes


  const clonedChildren = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
    onClick: (e: React.MouseEvent<HTMLElement>) => { // Changed: Explicit event type
      e.stopPropagation(); 
      if (timerRef.current) clearTimeout(timerRef.current); // Clear any pending show from hover
      setIsVisible(prev => !prev); // Toggle visibility immediately
      if (children.props.onClick) {
        children.props.onClick(e); // children.props.onClick is now correctly typed
      }
    },
    'aria-describedby': isVisible ? tooltipId : undefined,
  });

  if (typeof document === 'undefined') { 
    return <>{clonedChildren}</>;
  }

  return (
    <>
      {clonedChildren}
      {isVisible && ReactDOM.createPortal(
        <div
          id={tooltipId}
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[9999] px-3 py-2 text-sm font-medium text-white bg-neutral-focus rounded-lg shadow-xl max-w-xs break-words"
          style={{
            top: `${pos.top}px`,
            left: `${pos.left}px`,
            // opacity: isVisible ? 1 : 0, // CSS transition can handle this if preferred
            // transition: 'opacity 0.15s ease-in-out',
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;