import { useState, useEffect, useRef } from 'react';
import { createGraphInstance, updateGraphFilters } from '../services/graphBuilder';

export const useGraphData = (groups, flows, profiles) => {
  const [cy, setCy] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !groups || !flows) return;

    const instance = createGraphInstance(
      containerRef.current,
      groups,
      flows,
      profiles || {}
    );

    setCy(instance);

    return () => {
      instance.destroy();
    };
  }, [groups, flows, profiles]);

  return {
    cy,
    containerRef
  };
};