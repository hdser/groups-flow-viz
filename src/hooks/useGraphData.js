import { useState, useEffect, useRef } from 'react';
import { createGraphInstance, updateGraphFilters } from '../services/graphBuilder';
import { useStore } from './useStore';

export const useGraphData = (groups, flows, profiles, balances) => {
  const [cy, setCy] = useState(null);
  const containerRef = useRef(null);
  const { layoutType } = useStore();

  useEffect(() => {
    if (!containerRef.current || !groups || !flows) return;

    const instance = createGraphInstance(
      containerRef.current,
      groups,
      flows,
      profiles || {},
      balances
    );

    setCy(instance);

    return () => {
      instance.destroy();
    };
  }, [groups, flows, profiles, balances]);

  return {
    cy,
    containerRef
  };
};