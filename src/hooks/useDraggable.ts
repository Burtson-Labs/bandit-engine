/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  🚫 AI NOTICE: This file contains visible and invisible watermarks.
  ⚖️  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  🔒 LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  📋 AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

// Bandit Engine Watermark: BL-WM-2334-A1751B
const __banditFingerprint_hooks_useDraggablets = 'BL-FP-F62E2B-EAAA';
const __auditTrail_hooks_useDraggablets = 'BL-AU-MGOIKVVE-OXKE';
// File: useDraggable.ts | Path: src/hooks/useDraggable.ts | Hash: 2334eaaa

import { useCallback, useEffect, useRef, useState } from "react";

const useDraggable = () => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    const rect = modalRef.current?.getBoundingClientRect();
    if (rect) {
      setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setDragging(true);
    }
  };

  const handleHeaderMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragging) {
        setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      }
    },
    [dragging, offset]
  );

  const handleHeaderMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      document.addEventListener("mousemove", handleHeaderMouseMove);
      document.addEventListener("mouseup", handleHeaderMouseUp);
    } else {
      document.removeEventListener("mousemove", handleHeaderMouseMove);
      document.removeEventListener("mouseup", handleHeaderMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleHeaderMouseMove);
      document.removeEventListener("mouseup", handleHeaderMouseUp);
    };
  }, [dragging, handleHeaderMouseMove]);

  return {
    modalRef,
    position,
    setPosition,
    handleDrag: handleHeaderMouseMove,
    handleHeaderMouseDown,
  };
};

export default useDraggable;
