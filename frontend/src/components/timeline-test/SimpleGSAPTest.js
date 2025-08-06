import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const SimpleGSAPTest = () => {
  const boxRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) {
      gsap.to(boxRef.current, {
        duration: 2,
        x: 200,
        rotation: 360,
        backgroundColor: "blue",
        repeat: -1,
        yoyo: true
      });
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">GSAP Test</h1>
      <div 
        ref={boxRef}
        className="w-16 h-16 bg-red-500 rounded"
      />
      <p className="mt-4">If GSAP is working, you should see the red box animating.</p>
    </div>
  );
};

export default SimpleGSAPTest;
