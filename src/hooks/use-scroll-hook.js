import { useRef } from 'react';

export const useScrollHook = (callback, divRef, scrollType) => {
  const x = useRef(0);
  const y = useRef(0);
  const ticking = useRef(false);

  return () => {
    if (!divRef.current) return;

    switch (scrollType) {
      case 'horizontal':
        {
          const left = divRef.current.scrollLeft;

          if (left !== x.current) {
            x.current = left;

            if (!ticking.current) {
              window.requestAnimationFrame(() => {
                callback(left);

                ticking.current = false;
              });

              ticking.current = true;
            }
          }
        }
        break;

      case 'vertical':
        {
          const top = divRef.current.scrollTop;

          if (top !== y.current) {
            y.current = top;

            if (!ticking.current) {
              window.requestAnimationFrame(() => {
                callback(top);

                ticking.current = false;
              });

              ticking.current = true;
            }
          }
        }
        break;

      case 'both':
        {
          const left = divRef.current.scrollLeft;
          const top = divRef.current.scrollTop;

          if (left !== x.current || top !== y.current) {
            x.current = left;
            y.current = top;

            if (!ticking.current) {
              window.requestAnimationFrame(() => {
                callback(left, top);

                ticking.current = false;
              });

              ticking.current = true;
            }
          }
        }
        break;

      default:
        console.log('Invalid scroll type');
    }
  };
};
