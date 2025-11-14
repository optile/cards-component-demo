import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation(); // Get the current path from useLocation

  useEffect(() => {
    // Scroll to the top of the document when the pathname changes
    document.documentElement.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Use 'instant' for immediate scrolling, or 'smooth' for animation
    });
  }, [pathname]); // Re-run the effect whenever the pathname changes

  return null; // This component doesn't render any UI
}
export default ScrollToTop;
