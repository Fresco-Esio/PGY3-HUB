// useAnimatedModalHeight
// Unified modal height animation and measurement with scroll preservation.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export default function useAnimatedModalHeight({
  isOpen,
  activeTab,
  viewportMaxVH = 0.9,
  minContentPx = 120,
  animation = { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] },
}) {
  const headerRef = useRef(null);
  const tabsRef = useRef(null);
  const contentWrapperRef = useRef(null);
  const activePanelRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const viewportHRef = useRef(
    typeof window !== "undefined" ? window.innerHeight : 800
  );
  const [contentHeight, setContentHeight] = useState(0);
  const scrollPositionsRef = useRef({});
  const panelsRef = useRef({});

  const computeTargetHeight = useCallback(
    (panelEl) => {
      if (!panelEl) return contentWrapperRef.current?.offsetHeight || 0;
      const rectH = panelEl.getBoundingClientRect().height || 0;
      const offsetH = panelEl.offsetHeight || 0;
      const scrollH = panelEl.scrollHeight || 0;
      const panelH = Math.max(rectH, offsetH, scrollH);

      const headerH = headerRef.current?.offsetHeight || 0;
      const tabsH = tabsRef.current?.offsetHeight || 0;
      const chrome = headerH + tabsH;
      const budget = Math.max(
        200,
        viewportHRef.current * viewportMaxVH - chrome
      );

      return Math.max(minContentPx, Math.min(panelH, budget));
    },
    [viewportMaxVH, minContentPx]
  );

  const measureNow = useCallback(
    (panelEl) => {
      const target = computeTargetHeight(panelEl);
      setContentHeight(target);
    },
    [computeTargetHeight]
  );

  const setActivePanelEl = useCallback(
    (el) => {
      activePanelRef.current = el || null;
      if (el) {
        // Observe size changes
        if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
        if ("ResizeObserver" in window) {
          resizeObserverRef.current = new ResizeObserver(() => measureNow(el));
          resizeObserverRef.current.observe(el);
        }
        // Measure immediately
        measureNow(el);
      }
    },
    [measureNow]
  );

  // Double-RAF initial measurement to avoid transforms affecting size
  useLayoutEffect(() => {
    if (!isOpen) return;
    let raf1 = 0,
      raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (activePanelRef.current) measureNow(activePanelRef.current);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isOpen, activeTab, measureNow]);

  // Window resize handling
  useEffect(() => {
    const onResize = () => {
      viewportHRef.current = window.innerHeight;
      if (activePanelRef.current) measureNow(activePanelRef.current);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureNow]);

  // Clean up observer on unmount/close
  useEffect(() => {
    if (!isOpen && resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
  }, [isOpen]);

  // Scroll preservation API
  const saveScrollFor = useCallback((tabId) => {
    const wrapper = contentWrapperRef.current;
    if (!wrapper || !tabId) return;
    scrollPositionsRef.current[tabId] = wrapper.scrollTop || 0;
  }, []);

  const restoreScrollFor = useCallback((tabId) => {
    const wrapper = contentWrapperRef.current;
    if (!wrapper || !tabId) return;
    const y = scrollPositionsRef.current[tabId] || 0;
    wrapper.scrollTop = y;
  }, []);

  // Ref callback provider for tab panels
  const getPanelRef = useCallback(
    (tabId) => (el) => {
      if (el) panelsRef.current[tabId] = el;
      if (tabId === activeTab) setActivePanelEl(el);
    },
    [activeTab, setActivePanelEl]
  );

  const animateProps = useMemo(
    () => ({
      initial: false,
      animate: { height: contentHeight },
      transition: { duration: animation.duration, ease: animation.ease },
    }),
    [contentHeight, animation]
  );

  return {
    headerRef,
    tabsRef,
    contentWrapperRef,
    contentHeight,
    measureNow,
    setActivePanelEl,
    getPanelRef,
    saveScrollFor,
    restoreScrollFor,
    animateProps,
  };
}
