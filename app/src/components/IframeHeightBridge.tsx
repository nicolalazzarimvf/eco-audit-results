"use client";

import { useEffect } from "react";

function getDocumentHeight(): number {
  const body = document.body;
  const html = document.documentElement;
  const main = document.querySelector("main");
  const mainHeight = main ? Math.ceil(main.getBoundingClientRect().height) : 0;
  return Math.max(
    mainHeight,
    body?.scrollHeight ?? 0,
    body?.offsetHeight ?? 0,
    html?.clientHeight ?? 0,
    html?.scrollHeight ?? 0,
    html?.offsetHeight ?? 0
  );
}

export default function IframeHeightBridge() {
  useEffect(() => {
    if (!document.body) return;

    const postHeight = () => {
      window.parent?.postMessage(
        {
          source: "eco-audit-app",
          type: "ecoAuditResize",
          height: getDocumentHeight(),
        },
        "*"
      );
    };

    postHeight();
    const timeoutId = window.setTimeout(postHeight, 400);

    const observer = new MutationObserver(postHeight);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    window.addEventListener("resize", postHeight);

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener("resize", postHeight);
    };
  }, []);

  return null;
}
